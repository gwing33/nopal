import type { ActionFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { getPresignedUploadUrl } from "../data/file.server";
import { getFileContentType } from "../data/file.server";

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { filename: rawName, contentType: rawContentType } =
    (await request.json()) as { filename?: string; contentType?: string };

  if (!rawName) {
    return Response.json({ error: "filename is required" }, { status: 400 });
  }

  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `daily-log/${user._id}/${Date.now()}-${safeName}`;
  const contentType = rawContentType ?? getFileContentType(safeName);

  try {
    const { presignedUrl, publicUrl } = await getPresignedUploadUrl(
      filename,
      contentType,
    );
    return Response.json({ presignedUrl, publicUrl });
  } catch (err) {
    console.error("Presign error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Presign failed" },
      { status: 500 },
    );
  }
}
