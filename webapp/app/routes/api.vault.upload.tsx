import type { ActionFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { uploadPublicFileToS3 } from "../data/file.server";
import { createFileRef } from "../data/vault.server";

/**
 * POST /api/vault/upload
 *
 * Accepts multipart/form-data:
 *   file     — the File to upload
 *   folderId — (optional) vault folder _id to place the file in
 *
 * Uploads the file to S3 server-side (no browser→S3 CORS required) and
 * creates the corresponding file_ref record.
 */
export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const folderId = (form.get("folderId") as string | null) || null;

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const folderSegment = folderId ?? "root";
  const s3Key = `vault/${user._id}/${folderSegment}/${Date.now()}-${safeName}`;

  try {
    const url = await uploadPublicFileToS3(buffer, s3Key);

    const fileRef = await createFileRef({
      human_id: user._id,
      name: file.name,
      s3_url: url,
      s3_key: s3Key,
      content_type: file.type || "application/octet-stream",
      size: file.size,
      folder_id: folderId,
    });

    return Response.json({ url, fileRef }, { status: 201 });
  } catch (err) {
    console.error("Vault upload error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
