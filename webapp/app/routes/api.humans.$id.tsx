import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getHumanById,
  updateHuman,
  deleteHuman,
  type Role,
} from "../data/humans.server";

const VALID_ROLES: Role[] = ["Super", "Admin", "Human", "MaybeHuman"];

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const human = await getHumanById(id);
    if (!human) {
      return Response.json({ error: "Human not found" }, { status: 404 });
    }
    return Response.json(human);
  } catch (err) {
    console.error("GET /api/humans/:id error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!["Super", "Admin"].includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  if (request.method === "DELETE") {
    try {
      await deleteHuman(id);
      return Response.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/humans/:id error:", err);
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

    const { email, name, role } = body as {
      email?: unknown;
      name?: unknown;
      role?: unknown;
    };

    if (!email || typeof email !== "string") {
      return Response.json(
        { error: "Field 'email' is required and must be a string" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return Response.json(
        { error: "Field 'name' is required and must be a string" },
        { status: 400 }
      );
    }

    if (!role || !VALID_ROLES.includes(role as Role)) {
      return Response.json(
        { error: `Field 'role' must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    try {
      const updated = await updateHuman(id, {
        email,
        name,
        role: role as Role,
      });
      if (!updated) {
        return Response.json({ error: "Human not found" }, { status: 404 });
      }
      return Response.json(updated);
    } catch (err) {
      console.error("PUT /api/humans/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
