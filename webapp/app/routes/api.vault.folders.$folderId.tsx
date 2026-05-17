import type { ActionFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getFolderById,
  updateVaultFolder,
  deleteVaultFolderCascade,
} from "../data/vault.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { folderId } = params;
  if (!folderId) {
    return Response.json({ error: "folderId required" }, { status: 400 });
  }

  const folder = await getFolderById(folderId);
  if (!folder) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (folder.human_id !== user._id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (request.method === "DELETE") {
    await deleteVaultFolderCascade(folderId);
    return Response.json({ success: true });
  }

  if (request.method === "PATCH") {
    const body = (await request.json()) as {
      name?: string;
      shared_with?: string[] | "everyone";
    };

    const updates: Parameters<typeof updateVaultFolder>[1] = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.shared_with !== undefined) updates.shared_with = body.shared_with;

    const updated = await updateVaultFolder(folderId, updates);
    return Response.json({ folder: updated });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
