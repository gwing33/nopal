import type { ActionFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { uploadPublicFileToS3 } from "../data/file.server";

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
  const filename = `daily-log/${user._id}/${Date.now()}-${safeName}`;

  try {
    const url = await uploadPublicFileToS3(buffer, filename);
    return Response.json({ url });
  } catch (err) {
    console.error("S3 upload error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
