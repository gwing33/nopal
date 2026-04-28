import { RecordId } from "surrealdb";
import {
  Data,
  Collection,
  query,
  select,
  formatRecord,
  upsert,
  remove,
} from "./generic.server";

export type ProjectType = "Guide" | "Design+Build";

export type ProjectRole = "Client" | "Guide" | "Friend";

export type ProjectHuman = {
  humanId: string;
  role: ProjectRole;
};

export type Phase = { startDate: string; endDate: string; status: string };

export type Phases = Phase[];

/** [minCost, maxCost] */
export type CostRange = [number, number];

export type NopalPhase = "seed" | "sprout" | "seedling" | "flower" | "renewing";

export type Project = Data & {
  name: string;
  northStar: string;
  type: ProjectType;
  address: string;
  phases: Phases;
  humans: ProjectHuman[];
  costRange: CostRange;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  nopalPhase: NopalPhase;
  ideaOverview: string;
};

export type Projects = Collection<Project>;

export type ProjectInput = {
  name: string;
  northStar: string;
  type: ProjectType;
  address: string;
  phases: Phases;
  humans: ProjectHuman[];
  costRange: CostRange;
  actorId: string;
  nopalPhase?: NopalPhase;
  ideaOverview?: string;
};

export async function getProjects(): Promise<Projects | undefined> {
  return select<Project>(`projects`);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const result = await query<[Project[]]>(
    `SELECT * FROM projects WHERE id = $id;`,
    { id: new RecordId("projects", id) },
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}

export async function createProject(
  data: ProjectInput,
): Promise<Project | undefined> {
  const { actorId, ...fields } = data;
  const now = new Date().toISOString();

  const result = await upsert("projects", {
    ...fields,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as Project) : undefined;
}

export async function updateProject(
  id: string,
  data: Partial<Omit<ProjectInput, "actorId">> & { actorId: string },
): Promise<Project | undefined> {
  const { actorId, ...fields } = data;

  const existing = await getProjectById(id);
  if (!existing) return undefined;

  const result = await upsert(new RecordId("projects", id), {
    ...existing,
    ...fields,
    updatedAt: new Date().toISOString(),
    updatedBy: actorId,
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as Project) : undefined;
}

export async function deleteProject(id: string): Promise<void> {
  await remove("projects", id);
}

/** Creates a new project in the seed phase, called from the public /plant-seed form */
export async function createSeedProject(data: {
  name: string;
  northStar: string;
  ideaOverview: string;
  humanId: string;
  humanRole: ProjectRole;
  actorId: string;
}): Promise<Project | undefined> {
  const { humanId, humanRole, actorId, ...fields } = data;
  const now = new Date().toISOString();

  const result = await upsert("projects", {
    ...fields,
    nopalPhase: "seed" as NopalPhase,
    type: "Guide" as ProjectType,
    address: "",
    phases: [],
    humans: [{ humanId, role: humanRole }],
    costRange: [0, 0] as CostRange,
    createdAt: now,
    updatedAt: now,
    createdBy: actorId,
    updatedBy: actorId,
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as Project) : undefined;
}

export async function getProjectsByHumanId(
  humanId: string,
): Promise<Project[]> {
  const result = await getProjects();
  const all = result?.data ?? [];
  return all.filter((p) => p.humans.some((h) => h.humanId === humanId));
}
