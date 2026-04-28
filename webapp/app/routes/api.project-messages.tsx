import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getMessagesByProjectId,
  createMessage,
} from "../data/projectMessages.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return Response.json(
      { error: "Query parameter 'projectId' is required" },
      { status: 400 }
    );
  }

  try {
    const messages = await getMessagesByProjectId(projectId);
    return Response.json({ data: messages });
  } catch (err) {
    console.error("GET /api/project-messages error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, humanId, content, isInternal } = body as {
    projectId?: unknown;
    humanId?: unknown;
    content?: unknown;
    isInternal?: unknown;
  };

  if (!projectId || typeof projectId !== "string") {
    return Response.json(
      { error: "Field 'projectId' is required and must be a string" },
      { status: 400 }
    );
  }

  if (!humanId || typeof humanId !== "string") {
    return Response.json(
      { error: "Field 'humanId' is required and must be a string" },
      { status: 400 }
    );
  }

  if (!content || typeof content !== "string") {
    return Response.json(
      { error: "Field 'content' is required and must be a string" },
      { status: 400 }
    );
  }

  if (typeof isInternal !== "boolean") {
    return Response.json(
      { error: "Field 'isInternal' is required and must be a boolean" },
      { status: 400 }
    );
  }

  try {
    const created = await createMessage({
      projectId,
      humanId,
      content,
      isInternal,
    });

    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/project-messages error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
