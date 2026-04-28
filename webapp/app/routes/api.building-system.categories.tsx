import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { getCategories, createCategory } from "../data/buildingSystem.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const result = await getCategories();
    return Response.json(result);
  } catch (err) {
    console.error("GET /api/building-system/categories error:", err);
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

  const { name, slug } = body as { name?: unknown; slug?: unknown };

  if (!name || typeof name !== "string") {
    return Response.json(
      { error: "Field 'name' is required and must be a string" },
      { status: 400 }
    );
  }

  if (!slug || typeof slug !== "string") {
    return Response.json(
      { error: "Field 'slug' is required and must be a string" },
      { status: 400 }
    );
  }

  try {
    const created = await createCategory({ name, slug });
    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/building-system/categories error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
