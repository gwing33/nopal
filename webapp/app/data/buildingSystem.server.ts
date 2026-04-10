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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MarkdownBlock = {
  type: "markdown";
  md: string;
};

export type Block = MarkdownBlock;

export type BsCategory = Data & {
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type BsCategories = Collection<BsCategory>;

export type BsCategoryInput = {
  name: string;
  slug: string;
};

export type BuildingSystem = Data & {
  name: string;
  slug: string;
  blocks: Block[];
  categoryId: string;
  createdAt: string;
  updatedAt: string;
};

export type BuildingSystems = Collection<BuildingSystem>;

export type BuildingSystemInput = {
  name: string;
  slug: string;
  blocks: Block[];
  categoryId: string;
};

// ---------------------------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<BsCategories | undefined> {
  return select<BsCategory>(`bs_categories`);
}

export async function getCategoryById(
  id: string
): Promise<BsCategory | undefined> {
  const result = await query<[BsCategory[]]>(
    `SELECT * FROM bs_categories WHERE id = $id;`,
    { id: new RecordId("bs_categories", id) }
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}

export async function getCategoryByName(
  name: string
): Promise<BsCategory | undefined> {
  const result = await query<[BsCategory[]]>(
    `SELECT * FROM bs_categories WHERE name = $name LIMIT 1;`,
    { name }
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}

export async function createCategory(
  data: BsCategoryInput
): Promise<BsCategory | undefined> {
  const now = new Date().toISOString();

  const result = await upsert("bs_categories", {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as BsCategory) : undefined;
}

export async function getOrCreateCategoryByName(
  name: string
): Promise<BsCategory | undefined> {
  const existing = await getCategoryByName(name);
  if (existing) return existing;

  return createCategory({ name, slug: name });
}

export async function updateCategory(
  id: string,
  data: Partial<BsCategoryInput>
): Promise<BsCategory | undefined> {
  const existing = await getCategoryById(id);
  if (!existing) return undefined;

  const result = await upsert(new RecordId("bs_categories", id), {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as BsCategory) : undefined;
}

export async function deleteCategory(id: string): Promise<void> {
  await remove("bs_categories", id);
}

// ---------------------------------------------------------------------------
// Building System CRUD
// ---------------------------------------------------------------------------

export async function getBuildingSystems(): Promise<
  BuildingSystems | undefined
> {
  return select<BuildingSystem>(`building_systems`);
}

export async function getBuildingSystemById(
  id: string
): Promise<BuildingSystem | undefined> {
  const result = await query<[BuildingSystem[]]>(
    `SELECT * FROM building_systems WHERE id = $id;`,
    { id: new RecordId("building_systems", id) }
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}

export async function getBuildingSystemBySlug(
  slug: string
): Promise<BuildingSystem | undefined> {
  const result = await query<[BuildingSystem[]]>(
    `SELECT * FROM building_systems WHERE slug = $slug LIMIT 1;`,
    { slug }
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}

export async function getBuildingSystemsByCategory(
  categoryId: string
): Promise<BuildingSystem[]> {
  const result = await getBuildingSystems();
  const all = result?.data ?? [];
  return all.filter((bs) => bs.categoryId === categoryId);
}

export async function createBuildingSystem(
  data: BuildingSystemInput
): Promise<BuildingSystem | undefined> {
  const now = new Date().toISOString();

  const result = await upsert("building_systems", {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as BuildingSystem) : undefined;
}

export async function updateBuildingSystem(
  id: string,
  data: Partial<BuildingSystemInput>
): Promise<BuildingSystem | undefined> {
  const existing = await getBuildingSystemById(id);
  if (!existing) return undefined;
  const { id: _, ...rest } = existing;
  const result = await upsert(new RecordId("building_systems", id), {
    ...rest,
    ...data,
    updatedAt: new Date().toISOString(),
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as BuildingSystem) : undefined;
}

export async function deleteBuildingSystem(id: string): Promise<void> {
  await remove("building_systems", id);
}
