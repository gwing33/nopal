import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../data/buildingSystem.server";

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
    const category = await getCategoryById(id);
    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }
    return Response.json(category);
  } catch (err) {
    console.error("GET /api/building-system/categories/:id error:", err);
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
      const existing = await getCategoryById(id);
      if (!existing) {
        return Response.json({ error: "Category not found" }, { status: 404 });
      }
      await deleteCategory(id);
      return Response.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/building-system/categories/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  if (request.method === "PUT") {
    let body: { name?: unknown; slug?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, slug } = body;

    if (name !== undefined && typeof name !== "string") {
      return Response.json(
        { error: "Field 'name' must be a string" },
        { status: 400 }
      );
    }

    if (slug !== undefined && typeof slug !== "string") {
      return Response.json(
        { error: "Field 'slug' must be a string" },
        { status: 400 }
      );
    }

    try {
      const updated = await updateCategory(id, {
        ...(name !== undefined && { name: name as string }),
        ...(slug !== undefined && { slug: slug as string }),
      });

      if (!updated) {
        return Response.json({ error: "Category not found" }, { status: 404 });
      }

      return Response.json(updated);
    } catch (err) {
      console.error("PUT /api/building-system/categories/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
