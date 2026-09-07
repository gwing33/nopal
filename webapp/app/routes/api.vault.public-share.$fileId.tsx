import type { LoaderFunctionArgs } from "react-router";
import { Readable } from "node:stream";
import { getFileRefById, isFileEffectivelyPublic } from "robustness-core/data/vault.server";
import { downloadFileStream } from "robustness-core/data/file.server";

/**
 * GET /api/vault/public-share/:fileId
 *
 * Streams a public file's raw bytes back SAME-ORIGIN — never a redirect to
 * S3. Used by two client-side flows on `/public/folder/:folderId` that
 * both need real bytes in JS rather than a URL to navigate to:
 *   - "Save to Photos" — builds real `File` objects to hand to `navigator
 *     .share({ files })` (the Web Share API's file form — see that route
 *     for why this is the only standards-based way to land a file in the
 *     OS Photos app).
 *   - "Download all" — Blob-downloads each file via an in-memory object
 *     URL instead of navigating an `<a>` to a presigned S3 URL. That
 *     approach used to regularly misfire: a cross-origin `download`
 *     attribute isn't reliably honored, so the browser would sometimes
 *     navigate the whole tab to the raw image instead of saving it —
 *     confusing on its own, and worse combined with the back-forward
 *     cache, which could resume the in-flight "download all" loop after
 *     the user hit Back, silently opening the NEXT file the same way.
 *     A same-origin `blob:` URL's `download` attribute is always honored,
 *     so this sidesteps the whole class of bug.
 *
 * `/api/vault/public-view/:fileId` (a 302 to a presigned S3 URL) is
 * deliberately NOT reused for either: a `fetch()` reading that response's
 * BODY cross-origin would depend on the S3 bucket's own CORS configuration,
 * which isn't guaranteed — proxying through our own origin sidesteps that
 * entirely. An `<img>`/`<video>` tag has no such requirement (rendering
 * doesn't need to read the bytes in JS), so plain media display keeps
 * using the cheaper redirect.
 *
 * STREAMS an S3-backed file via `downloadFileStream` (Range-chunked reads
 * — see that function's own doc) straight into the Response body, rather
 * than buffering the whole file into memory first. This used to buffer
 * fully via `downloadFileBytes`, which was the direct cause of a real
 * production OOM: "Save to Photos" calls this once per image, and a
 * folder of large photos could rack up serious memory even processed one
 * request at a time, since nothing was releasing the previous file's
 * buffer particularly fast under load. A content-only (markdown) file has
 * no S3 object and is tiny by construction, so it's still just read as
 * plain bytes.
 *
 * 404 (not 403) whenever the file isn't public, so this can't be used to
 * probe which file ids exist.
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { fileId } = params;
  if (!fileId) {
    return Response.json({ error: "fileId required" }, { status: 400 });
  }

  const file = await getFileRefById(fileId);
  if (!file || !(await isFileEffectivelyPublic(file))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    if (file.s3_key) {
      const stream = await downloadFileStream(file.s3_key);
      return new Response(Readable.toWeb(stream) as ReadableStream, {
        headers: {
          "Content-Type": file.content_type || "application/octet-stream",
        },
      });
    }

    if (file.content != null) {
      // Content-only files (markdown) have no S3 object — their "bytes"
      // are just their stored text, UTF-8 encoded. Always small, so a
      // plain buffered response is fine.
      const bytes = Buffer.from(file.content, "utf-8");
      return new Response(new Uint8Array(bytes), {
        headers: {
          "Content-Type": file.content_type || "application/octet-stream",
          "Content-Length": String(bytes.length),
        },
      });
    }

    return Response.json({ error: "No file attached" }, { status: 400 });
  } catch (err) {
    console.error("Public share bytes error:", err);
    return Response.json({ error: "Failed to load file" }, { status: 500 });
  }
}
