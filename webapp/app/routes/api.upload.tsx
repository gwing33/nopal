import type { ActionFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { uploadPublicFileToS3 } from "../data/file.server";
import { createFileRef } from "../data/vault.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const s3Key = `daily-log/${user._id}/${Date.now()}-${safeName}`;

  try {
    const url = await uploadPublicFileToS3(buffer, s3Key);

    // Register in file_refs (no vault folder — daily-log uploads live at root)
    await createFileRef({
      human_id: user._id,
      name: file.name,
      s3_url: url,
      s3_key: s3Key,
      content_type: file.type || "application/octet-stream",
      size: file.size,
      folder_id: null,
    });

    return Response.json({ url });
  } catch (err) {
    console.error("S3 upload error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
