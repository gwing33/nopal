import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getHumans,
  createHuman,
  type Role,
} from "../data/humans.server";

const VALID_ROLES: Role[] = ["Super", "Admin", "Human", "MaybeHuman"];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await getHumans();
    return Response.json(result);
  } catch (err) {
    console.error("GET /api/humans error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!["Super", "Admin"].includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
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
    const created = await createHuman({
      email,
      name,
      role: role as Role,
    });

    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/humans error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
