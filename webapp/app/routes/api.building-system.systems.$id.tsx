import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getBuildingSystemById,
  updateBuildingSystem,
  deleteBuildingSystem,
} from "../data/buildingSystem.server";
import type { BuildingSystemInput } from "../data/buildingSystem.server";

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
    const system = await getBuildingSystemById(id);
    if (!system) {
      return Response.json({ error: "Building system not found" }, { status: 404 });
    }
    return Response.json(system);
  } catch (err) {
    console.error("GET /api/building-system/systems/:id error:", err);
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
      const existing = await getBuildingSystemById(id);
      if (!existing) {
        return Response.json({ error: "Building system not found" }, { status: 404 });
      }
      await deleteBuildingSystem(id);
      return Response.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/building-system/systems/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  if (request.method === "PUT") {
    let body: {
      name?: unknown;
      slug?: unknown;
      blocks?: unknown;
      categoryId?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, slug, blocks, categoryId } = body;

    if (
      blocks !== undefined &&
      !Array.isArray(blocks)
    ) {
      return Response.json(
        { error: "Field 'blocks' must be an array" },
        { status: 400 }
      );
    }

    const patch: Partial<BuildingSystemInput> = {
      ...(name !== undefined && { name: name as string }),
      ...(slug !== undefined && { slug: slug as string }),
      ...(blocks !== undefined && { blocks: blocks as BuildingSystemInput["blocks"] }),
      ...(categoryId !== undefined && { categoryId: categoryId as string }),
    };

    try {
      const updated = await updateBuildingSystem(id, patch);
      if (!updated) {
        return Response.json({ error: "Building system not found" }, { status: 404 });
      }
      return Response.json(updated);
    } catch (err) {
      console.error("PUT /api/building-system/systems/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
