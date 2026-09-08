/**
 * Background zip generation for a published folder's "Download all" —
 * used by `/public/folder/:folderId` (the public, unauthenticated vault
 * browser). Zipping a folder of large photos can take long enough that
 * doing it inline in an HTTP handler would tie up a web server process
 * and leave the visitor staring at a spinner with zero feedback. Same
 * BullMQ-over-Redis "enqueue, poll, get result" shape GraphLog already
 * established (see `graphLogQueue.server.ts`) — a real `Worker` (see
 * `packages/worker/worker.ts`) consumes this queue, on its own queue name
 * so a burst of zip requests can never starve GraphLog's own worker
 * concurrency (they're two separate `Worker` instances in one process).
 *
 * CACHING is folded directly into the queue rather than a separate DB
 * table: a job's id IS the cache key (`<folderId>-<fingerprint>`, see
 * `computeFolderZipFingerprint`), and BullMQ already keeps a
 * completed/failed job's data around for a while afterward
 * (`removeOnComplete`/`removeOnFail` below). Two "Download all" clicks
 * against the same folder's CURRENT file set therefore naturally converge
 * on the same job id — the second one finds it already `waiting`/
 * `active`/`completed` and never re-zips. The moment any file in the
 * folder changes (added, removed, or replaced — anything that bumps that
 * file's own `updated_at`), the fingerprint changes, so it's a fresh job
 * id and a fresh zip; nothing to explicitly invalidate.
 */

import crypto from "node:crypto";
import { PassThrough, type Readable } from "node:stream";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import archiver from "archiver";
import {
  getFileRefById,
  getFolderById,
  listFolderChildren,
  resolvePublicRootFolder,
  type FileRefListing,
} from "./vault.server";
import { downloadFileStream, uploadPrivateStreamToS3 } from "./file.server";

let connection: IORedis | undefined;

function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export const PUBLIC_ZIP_QUEUE_NAME = "public-folder-zip";

export type PublicZipJobData = { folderId: string };
export type PublicZipProgress = { done: number; total: number };
export type PublicZipJobResult = { s3Key: string; size: number; fileCount: number };

let queue: Queue<PublicZipJobData, PublicZipJobResult, string> | undefined;

export function getPublicZipQueue(): Queue<PublicZipJobData, PublicZipJobResult, string> {
  if (!queue) {
    queue = new Queue(PUBLIC_ZIP_QUEUE_NAME, { connection: getConnection() });
  }
  return queue;
}

// Keep a finished job's data around for a while so a repeat request within
// this window is an instant cache hit (or an instant "here's why it
// failed") instead of a silent re-zip — see module doc. Not indefinite:
// the generated zip's own S3 object isn't cleaned up on a TTL today, so an
// unbounded cache here would just mean an unbounded number of orphaned
// zip objects too.
const JOB_OPTIONS = {
  attempts: 1,
  removeOnComplete: { age: 24 * 60 * 60 },
  removeOnFail: { age: 60 * 60 },
};

/** Stable per-folder fingerprint of its CURRENT direct-child file set —
 * changes whenever a file is added, removed, or replaced (replace always
 * bumps `updated_at`, confirmed by `api.vault.replace.$fileId.tsx`). Order-
 * independent (sorted before hashing) since `listFolderChildren`'s own
 * order isn't a meaningful part of "did the contents change". */
export function computeFolderZipFingerprint(
  files: Pick<FileRefListing, "_id" | "updated_at">[],
): string {
  const basis = [...files]
    .map((f) => `${f._id}:${f.updated_at}`)
    .sort()
    .join("|");
  return crypto.createHash("sha256").update(basis).digest("hex").slice(0, 16);
}

function publicZipJobId(folderId: string, fingerprint: string): string {
  // NOT a `:` separator -- BullMQ rejects a custom job id containing one
  // ("Custom Id cannot contain :"), since it uses `:` internally as its
  // own Redis key delimiter.
  return `${folderId}-${fingerprint}`;
}

/**
 * Enqueues a zip job for this exact (folder, fingerprint) pair if — and
 * only if — one isn't already waiting/active/completed (see module doc).
 * Always safe to call on every "Download all" click; the caller never has
 * to decide whether this is a cache hit itself. A previously FAILED
 * attempt at this same fingerprint is removed and retried, rather than
 * permanently stuck reporting the same old error.
 */
export async function ensurePublicZipJob(folderId: string, fingerprint: string): Promise<string> {
  const jobId = publicZipJobId(folderId, fingerprint);
  const q = getPublicZipQueue();
  const existing = await q.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === "failed") {
      await existing.remove();
    } else {
      return jobId;
    }
  }
  await q.add("zip", { folderId }, { ...JOB_OPTIONS, jobId });
  return jobId;
}

export type PublicZipJobStatus =
  | {
      ok: true;
      state: "waiting" | "active" | "delayed" | "completed" | "failed" | "unknown";
      folderId: string;
      progress?: PublicZipProgress | null;
      result?: PublicZipJobResult;
      error?: string;
    }
  | { ok: false; error: string };

export async function getPublicZipJobStatus(jobId: string): Promise<PublicZipJobStatus> {
  const q = getPublicZipQueue();
  const job = await q.getJob(jobId);
  if (!job) return { ok: false, error: "Job not found" };

  const state = await job.getState();
  const folderId = job.data.folderId;

  if (state === "completed") {
    return { ok: true, state, folderId, result: job.returnvalue };
  }
  if (state === "failed") {
    return { ok: true, state, folderId, error: job.failedReason };
  }
  if (state === "waiting" || state === "active" || state === "delayed") {
    return {
      ok: true,
      state,
      folderId,
      progress: (job.progress as PublicZipProgress | null) ?? null,
    };
  }
  return { ok: true, state: "unknown", folderId };
}

/**
 * Appends one entry to `archive` and waits until ARCHIVER ITSELF has fully
 * read it (its own `"entry"` event) before resolving — the caller uses
 * this to process files strictly one at a time, so at most one file's
 * worth of stream data is ever in flight, regardless of how many files
 * the folder has.
 */
function appendEntryAndWait(
  archive: archiver.Archiver,
  input: Readable | Buffer,
  name: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      archive.off("entry", onEntry);
      archive.off("error", onError);
    };
    const onEntry = (data: archiver.EntryData) => {
      if (data.name !== name) return;
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    archive.on("entry", onEntry);
    archive.on("error", onError);
    archive.append(input, { name });
  });
}

/**
 * The actual work — called by `packages/worker/worker.ts`'s job processor,
 * never directly by a web request. DIRECT child files only, same boundary
 * the on-page listing itself uses (a nested sub-folder isn't included;
 * visit that sub-folder's own public page to download it separately).
 *
 * STREAMS all the way through — each file straight from S3 into the zip
 * (`downloadFileStream`/`appendEntryAndWait`, one at a time), and the zip's
 * own compressed output straight back out to S3 as it's produced
 * (`uploadPrivateStreamToS3`, a real multipart upload) — rather than
 * buffering a whole file, let alone the whole assembled zip, in memory.
 * That first version (buffer everything, then upload one big Buffer) is
 * what caused a REAL production failure on a 36-photo folder: peak memory
 * climbed high enough to trigger long GC pauses, which stalled the event
 * loop long enough that BullMQ's own lock-renewal timer missed its window
 * ("could not renew lock for job ...") — the job LOOKED stuck partway
 * through, when what was actually happening was the process struggling
 * under memory pressure. Streaming keeps peak memory bounded to roughly
 * one file's chunk size plus a few in-flight multipart-upload parts,
 * regardless of how many files or how large they are.
 */
export async function runPublicFolderZip(
  folderId: string,
  onProgress?: (progress: PublicZipProgress) => void,
): Promise<PublicZipJobResult> {
  const folder = await getFolderById(folderId);
  if (!folder) throw new Error("Folder not found");

  // Re-checked here (not just trusted from whoever enqueued this) in case
  // the folder was unpublished between the click and this job running.
  const publicRoot = await resolvePublicRootFolder(folderId);
  if (!publicRoot) throw new Error("This folder is no longer published");

  const { files } = await listFolderChildren(folder.human_id, folderId);
  if (!files.length) throw new Error("This folder has no files to zip");

  const usedNames = new Set<string>();
  const dedupeName = (name: string): string => {
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : "";
    let candidate = name;
    for (let i = 2; usedNames.has(candidate); i++) {
      candidate = `${base} (${i})${ext}`;
    }
    usedNames.add(candidate);
    return candidate;
  };

  // Named by fingerprint (not a random id) so a rare re-run against an
  // unchanged file set (e.g. a retried failed job after the original's
  // BullMQ record was evicted) overwrites the same S3 object instead of
  // leaving an orphaned duplicate behind.
  const fingerprint = computeFolderZipFingerprint(files);
  const s3Key = `vault-zips/${folderId}/${fingerprint}.zip`;

  const archive = archiver("zip", { zlib: { level: 6 } });

  // `@aws-sdk/lib-storage`'s `Upload` rejects archiver's own stream object
  // directly ("Body Data is unsupported format") — confirmed against a
  // real MinIO while validating this. Piping through a plain PassThrough
  // first is the standard, documented workaround.
  const output = new PassThrough();
  // `.pipe()` does NOT forward "error" events to its destination (by
  // design, so multiple sources can share one destination) — without this,
  // an archive failure would leave `output` (and the upload reading from
  // it) hanging open forever instead of surfacing the failure.
  archive.on("error", (err) => output.destroy(err));
  archive.on("warning", (err) => {
    if (err.code !== "ENOENT") archive.emit("error", err);
  });
  archive.pipe(output);

  // Starts consuming `output` AS it's produced — peak memory here is
  // bounded to whatever `@aws-sdk/lib-storage` buffers per in-flight
  // multipart part (a few MB), never the whole zip.
  const uploadPromise = uploadPrivateStreamToS3(output, s3Key);

  let addedCount = 0;
  onProgress?.({ done: 0, total: files.length });
  for (const listing of files) {
    try {
      const file = await getFileRefById(listing._id);
      if (!file) continue;

      const zipName = dedupeName(file.name);
      if (file.s3_key) {
        const stream = await downloadFileStream(file.s3_key);
        await appendEntryAndWait(archive, stream, zipName);
      } else if (file.content != null) {
        await appendEntryAndWait(archive, Buffer.from(file.content, "utf-8"), zipName);
      } else {
        continue;
      }
      addedCount++;
    } catch (err) {
      // Skip this one file; the rest of the zip still gets built.
      console.error(`Skipping ${listing.name} in public zip:`, err);
    }
    onProgress?.({ done: addedCount, total: files.length });
  }

  if (addedCount === 0) {
    const noFilesError = new Error("Couldn't load any files to zip");
    archive.abort();
    // Explicitly destroyed rather than relying on `archive.abort()` to
    // propagate all the way through the pipe on its own -- without this,
    // an abort with no clean "end" could leave `uploadPromise` hanging
    // forever instead of settling.
    output.destroy(noFilesError);
    await uploadPromise.catch(() => {
      // Whatever error resulted is irrelevant next to noFilesError below.
    });
    throw noFilesError;
  }

  archive.finalize();
  await uploadPromise;

  return { s3Key, size: archive.pointer(), fileCount: addedCount };
}
