import type { LoaderFunctionArgs } from "react-router";
import { getFileRefById, isFileEffectivelyPublic } from "robustness-core/data/vault.server";
import { downloadFileBytes } from "robustness-core/data/file.server";

/**
 * GET /api/vault/public-share/:fileId
 *
 * Streams a public file's raw bytes back SAME-ORIGIN — never a redirect to
 * S3. Used only by the "Save to Photos" flow on `/public/folder/:folderId`,
 * which needs real `File` objects client-side to hand to `navigator.share
 * ({ files })` (the Web Share API's file form — see that route for why
 * this is the only standards-based way to land a file in the OS Photos
 * app). `/api/vault/public-view/:fileId` (a 302 to a presigned S3 URL) is
 * deliberately NOT reused here: a `fetch()` reading that response's BODY
 * cross-origin would depend on the S3 bucket's own CORS configuration,
 * which isn't guaranteed — proxying through our own origin sidesteps that
 * entirely. An `<img>`/`<video>` tag has no such requirement (rendering
 * doesn't need to read the bytes in JS), so every other media path keeps
 * using the cheaper redirect.
 *
 * Buffers the whole file in memory via `downloadFileBytes` — the same
 * tradeoff `syncKnowledge.server.ts` already accepts for feeding images to
 * a vision LLM call. Fine for the image-sized files this is meant for; not
 * intended as a general-purpose file-serving path.
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

  if (!file.s3_key) {
    return Response.json({ error: "No file attached" }, { status: 400 });
  }

  try {
    const bytes = await downloadFileBytes(file.s3_key);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": file.content_type || "application/octet-stream",
        "Content-Length": String(bytes.length),
      },
    });
  } catch (err) {
    console.error("Public share bytes error:", err);
    return Response.json({ error: "Failed to load file" }, { status: 500 });
  }
}
