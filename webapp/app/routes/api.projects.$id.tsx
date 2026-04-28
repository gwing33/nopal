import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "../data/projects.server";
import type { NopalPhase, ProjectType, ProjectHuman, Phases, CostRange } from "../data/projects.server";

const VALID_NOPAL_PHASES: NopalPhase[] = [
  "seed",
  "sprout",
  "seedling",
  "flower",
  "renewing",
];

const VALID_PROJECT_TYPES: ProjectType[] = ["Guide", "Design+Build"];

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
    const project = await getProjectById(id);
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
    return Response.json(project);
  } catch (err) {
    console.error("GET /api/projects/:id error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      const existing = await getProjectById(id);
      if (!existing) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }
      await deleteProject(id);
      return Response.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/projects/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  if (request.method === "PUT") {
    let body: {
      name?: unknown;
      northStar?: unknown;
      type?: unknown;
      address?: unknown;
      phases?: unknown;
      humans?: unknown;
      costRange?: unknown;
      nopalPhase?: unknown;
      ideaOverview?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      name,
      northStar,
      type,
      address,
      phases,
      humans,
      costRange,
      nopalPhase,
      ideaOverview,
    } = body;

    // Validate optional enum fields if provided
    if (
      type !== undefined &&
      !VALID_PROJECT_TYPES.includes(type as ProjectType)
    ) {
      return Response.json(
        {
          error: `Field 'type' must be one of: ${VALID_PROJECT_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (
      nopalPhase !== undefined &&
      !VALID_NOPAL_PHASES.includes(nopalPhase as NopalPhase)
    ) {
      return Response.json(
        {
          error: `Field 'nopalPhase' must be one of: ${VALID_NOPAL_PHASES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (
      costRange !== undefined &&
      (!Array.isArray(costRange) ||
        costRange.length !== 2 ||
        typeof costRange[0] !== "number" ||
        typeof costRange[1] !== "number")
    ) {
      return Response.json(
        { error: "Field 'costRange' must be a [number, number] tuple" },
        { status: 400 }
      );
    }

    try {
      const updated = await updateProject(id, {
        ...(name !== undefined && { name: name as string }),
        ...(northStar !== undefined && { northStar: northStar as string }),
        ...(type !== undefined && { type: type as ProjectType }),
        ...(address !== undefined && { address: address as string }),
        ...(phases !== undefined && { phases: phases as Phases }),
        ...(humans !== undefined && { humans: humans as ProjectHuman[] }),
        ...(costRange !== undefined && { costRange: costRange as CostRange }),
        ...(nopalPhase !== undefined && { nopalPhase: nopalPhase as NopalPhase }),
        ...(ideaOverview !== undefined && { ideaOverview: ideaOverview as string }),
        actorId: user._id,
      });

      if (!updated) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }

      return Response.json(updated);
    } catch (err) {
      console.error("PUT /api/projects/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
