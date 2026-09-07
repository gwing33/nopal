import type { LoaderFunctionArgs } from "react-router";
import archiver from "archiver";
import {
  getFileRefById,
  getFolderById,
  listFolderChildren,
  resolvePublicRootFolder,
} from "robustness-core/data/vault.server";
import { downloadFileBytes } from "robustness-core/data/file.server";

/**
 * GET /api/vault/public-folders/:folderId/zip
 *
 * "Download all" for a published folder, as ONE .zip — the client just
 * navigates an `<a href>` here (see `public.folder.$folderId.tsx`), same
 * as the plain single-file `/api/vault/public-download/:fileId` link that
 * already worked reliably. This replaces an earlier approach that fetched
 * each file individually client-side and Blob-downloaded them one at a
 * time: besides being N round trips instead of one, browsers (Chrome in
 * particular) throttle/gate automatic multi-file downloads triggered by a
 * page after just a handful, silently stalling the rest with no error to
 * catch. A single zip is a single download, so that gate never engages.
 *
 * DIRECT child files only — same boundary the on-page listing and the
 * old download-manifest route used, and for the same reason: a nested
 * sub-folder isn't included (visit that sub-folder's own public page to
 * download it separately). Zip entries COULD preserve a nested path, but
 * that's more than what's needed here today.
 *
 * Buffers every file fully in memory (both each original, one at a time
 * via `downloadFileBytes`, and the assembled zip itself) rather than
 * streaming — same tradeoff already made by `public-share`/`public-thumb`
 * for this feature, simpler to get right than wiring a Node stream through
 * this app's Response/Express layers. Fine for a folder of photos; a
 * folder of many huge files would be a reason to revisit this.
 *
 * 404 (not 403) whenever the folder isn't public, so this can't be used to
 * probe which folder ids exist.
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { folderId } = params;
  if (!folderId) {
    return Response.json({ error: "folderId required" }, { status: 400 });
  }

  const folder = await getFolderById(folderId);
  if (!folder) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const publicRoot = await resolvePublicRootFolder(folderId);
  if (!publicRoot) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { files } = await listFolderChildren(folder.human_id, folderId);
  if (!files.length) {
    return Response.json({ error: "This folder has no files to download" }, { status: 400 });
  }

  // Zip entry names must be unique — collide-avoid rather than clobber a
  // same-named file, however unlikely that is to occur in practice.
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

  const entries: Array<{ name: string; bytes: Buffer }> = [];
  for (const listing of files) {
    try {
      const file = await getFileRefById(listing._id);
      if (!file) continue;

      let bytes: Buffer;
      if (file.s3_key) {
        bytes = await downloadFileBytes(file.s3_key);
      } else if (file.content != null) {
        bytes = Buffer.from(file.content, "utf-8");
      } else {
        continue;
      }
      entries.push({ name: dedupeName(file.name), bytes });
    } catch (err) {
      // Skip this one file; the rest of the zip still gets built.
      console.error(`Skipping ${listing.name} in public zip:`, err);
    }
  }

  if (!entries.length) {
    return Response.json({ error: "Couldn't load any files to zip" }, { status: 500 });
  }

  const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
    archive.on("warning", (err) => {
      if (err.code !== "ENOENT") reject(err);
    });

    for (const entry of entries) {
      archive.append(entry.bytes, { name: entry.name });
    }
    archive.finalize();
  });

  const safeFolderName = (folder.name || "download").replace(/[^a-zA-Z0-9._-]/g, "_");

  return new Response(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeFolderName}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
