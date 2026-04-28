import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getBuildingSystems,
  getBuildingSystemsByCategory,
  getBuildingSystemBySlug,
  createBuildingSystem,
  type BuildingSystemInput,
} from "../data/buildingSystem.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId") ?? undefined;
    const slug = url.searchParams.get("slug") ?? undefined;

    if (slug) {
      const system = await getBuildingSystemBySlug(slug);
      if (!system) {
        return Response.json({ error: "Building system not found" }, { status: 404 });
      }
      return Response.json(system);
    }

    if (categoryId) {
      const systems = await getBuildingSystemsByCategory(categoryId);
      return Response.json({ data: systems });
    }

    const result = await getBuildingSystems();
    return Response.json(result);
  } catch (err) {
    console.error("GET /api/building-system/systems error:", err);
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

  const { name, slug, blocks, categoryId } = body as Record<string, unknown>;

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

  if (!Array.isArray(blocks)) {
    return Response.json(
      { error: "Field 'blocks' is required and must be an array" },
      { status: 400 }
    );
  }

  if (!categoryId || typeof categoryId !== "string") {
    return Response.json(
      { error: "Field 'categoryId' is required and must be a string" },
      { status: 400 }
    );
  }

  try {
    const input: BuildingSystemInput = {
      name,
      slug,
      blocks: blocks as BuildingSystemInput["blocks"],
      categoryId,
    };

    const created = await createBuildingSystem(input);
    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/building-system/systems error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
