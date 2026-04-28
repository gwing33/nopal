import type { ActionFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { updateMessage, deleteMessage } from "../data/projectMessages.server";

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  if (request.method === "DELETE") {
    try {
      await deleteMessage(id);
      return Response.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/project-messages/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  if (request.method === "PUT") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { content } = body as { content?: unknown };

    if (!content || typeof content !== "string") {
      return Response.json(
        { error: "Field 'content' is required and must be a string" },
        { status: 400 }
      );
    }

    try {
      const updated = await updateMessage(id, { content });
      if (!updated) {
        return Response.json({ error: "Message not found" }, { status: 404 });
      }
      return Response.json(updated);
    } catch (err) {
      console.error("PUT /api/project-messages/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
