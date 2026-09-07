import type { LoaderFunctionArgs } from "react-router";
import {
  getFileRefById,
  getFolderById,
  listFolderChildren,
  resolvePublicRootFolder,
} from "robustness-core/data/vault.server";
import { getPresignedDownloadUrl } from "robustness-core/data/file.server";

/**
 * GET /api/vault/public-folders/:folderId/download-manifest
 *
 * Public counterpart to `/api/vault/folders/:folderId/download-manifest` —
 * same "flat batch of individual downloads, not a zip" shape (see that
 * route's own doc for why), but reachable with no session/bearer token at
 * all — gated purely by the folder being published, or sitting inside a
 * published ancestor, same check `/public/folder/:folderId` itself makes.
 * DIRECT child files only; a nested sub-folder's files are skipped (visit
 * that sub-folder's own public page to download them).
 *
 * Same per-file shape the authenticated route and `/api/vault/public-
 * download/:fileId` return: `{ url }` for an S3-backed file, `{ content,
 * contentType }` for a content-only one. Entries that fail to resolve
 * (e.g. a presign error) are silently dropped rather than failing the
 * whole batch.
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

  // 404, not 403 — a private folder's existence isn't revealed, same
  // reasoning as the page loader itself.
  const publicRoot = await resolvePublicRootFolder(folderId);
  if (!publicRoot) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { files } = await listFolderChildren(folder.human_id, folderId);

  const entries = await Promise.all(
    files.map(async (listing) => {
      const file = await getFileRefById(listing._id);
      if (!file) return null;

      if (file.s3_key) {
        try {
          const url = await getPresignedDownloadUrl(file.s3_key, file.name);
          return { id: file._id, name: file.name, url };
        } catch (err) {
          console.error("Public presign download error:", err);
          return null;
        }
      }

      if (file.content != null) {
        return {
          id: file._id,
          name: file.name,
          content: file.content,
          contentType: file.content_type,
        };
      }

      return null;
    }),
  );

  return Response.json({ files: entries.filter((e) => e !== null) });
}
