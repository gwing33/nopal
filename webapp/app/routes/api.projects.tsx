import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getProjects,
  getProjectsByHumanId,
  createProject,
  type ProjectInput,
  type ProjectType,
  type NopalPhase,
} from "../data/projects.server";

const VALID_TYPES: ProjectType[] = ["Guide", "Design+Build"];
const VALID_NOPAL_PHASES: NopalPhase[] = [
  "seed",
  "sprout",
  "seedling",
  "flower",
  "renewing",
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const humanId = url.searchParams.get("humanId") ?? undefined;

    if (humanId) {
      const projects = await getProjectsByHumanId(humanId);
      return Response.json({ data: projects });
    }

    const result = await getProjects();
    return Response.json(result);
  } catch (err) {
    console.error("GET /api/projects error:", err);
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
  } = body as Record<string, unknown>;

  if (!name || typeof name !== "string") {
    return Response.json(
      { error: "Field 'name' is required and must be a string" },
      { status: 400 }
    );
  }

  if (!northStar || typeof northStar !== "string") {
    return Response.json(
      { error: "Field 'northStar' is required and must be a string" },
      { status: 400 }
    );
  }

  if (!type || !VALID_TYPES.includes(type as ProjectType)) {
    return Response.json(
      { error: `Field 'type' must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (typeof address !== "string") {
    return Response.json(
      { error: "Field 'address' is required and must be a string" },
      { status: 400 }
    );
  }

  if (!Array.isArray(phases)) {
    return Response.json(
      { error: "Field 'phases' is required and must be an array" },
      { status: 400 }
    );
  }

  if (!Array.isArray(humans)) {
    return Response.json(
      { error: "Field 'humans' is required and must be an array" },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(costRange) ||
    costRange.length !== 2 ||
    typeof costRange[0] !== "number" ||
    typeof costRange[1] !== "number"
  ) {
    return Response.json(
      {
        error:
          "Field 'costRange' is required and must be a [number, number] tuple",
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

  try {
    const input: ProjectInput = {
      name: name as string,
      northStar: northStar as string,
      type: type as ProjectType,
      address: address as string,
      phases: phases as ProjectInput["phases"],
      humans: humans as ProjectInput["humans"],
      costRange: costRange as ProjectInput["costRange"],
      actorId: user._id,
      nopalPhase: nopalPhase as NopalPhase | undefined,
      ideaOverview: typeof ideaOverview === "string" ? ideaOverview : undefined,
    };

    const created = await createProject(input);
    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/projects error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
