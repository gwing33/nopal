import { query } from "../generic.server";
import { registerDb, getAllPublishedPagesByDbRef } from "./core.server";
import type { TastingRecord } from "./types";
import { formatRecord } from "../generic.server";
import { RecordId } from "surrealdb";

const db = {
  id: "1d1f2211e45f80df81c3c82b831b45c1",
  dbName: "gbs_tastings_v2",
  getPublicUrl: (slug: string) => `/tastings/${slug}`,
};

export function registerTastingsDb() {
  registerDb(db);
}

export async function getSampleTastings(): Promise<{
  data: TastingRecord[];
}> {
  const results = await getAllPublishedPagesByDbRef(db.dbName);
  const recipePageIds = results.reduce((acc: string[], { page }) => {
    const recipes = page.properties?.["Recipe Database"];
    if (recipes?.type == "relation" && Array.isArray(recipes.relation)) {
      recipes.relation.forEach(({ id }) => {
        if (!acc.includes(id)) {
          acc.push(id);
        }
      });
    }
    return acc;
  }, []);
  const gbs = await getGBSByPageIds(recipePageIds);

  return {
    data: results.map(({ page }) => formatTastingRecord(page, gbs)),
  };
}

type GBSPage = { id: string; gbs: number };
async function getGBSByPageIds(ids: string[]): Promise<GBSPage[]> {
  const result = await query(
    `SELECT
      id,
      math::sum([
          properties["Carbon Score"].number,
          properties["Comfort Score"].number,
          properties["Efficiency Score"].number,
          properties["Longevity Score"].number,
          properties["Social Impact Score"].number
      ]) as gbs FROM notion_pages WHERE id IN $ids`,
    { ids: ids.map((id) => new RecordId("notion_pages", id)) }
  );

  const first = result[0];
  if (Array.isArray(first)) {
    return first.map(({ id, gbs }) => ({ id: id.id, gbs }));
  }
  return [];
}

function formatTastingRecord(_record: any, gbs: GBSPage[]): TastingRecord {
  const record = formatRecord(_record);
  const ingredient: TastingRecord = {
    id: record.id,
    _id: record._id,
    name: record.properties.Name.title[0]?.plain_text || "",
    slug: record.properties.Slug.rich_text[0]?.plain_text || "",
    summary: record.properties.Summary,
    annotation: record.properties.Annotation.rich_text[0]?.plain_text || "",
    status: record.properties.Status.select?.name || "",
    thumbnail: record.properties.Thumbnail.files?.[0]?.file?.url || "",
    scores: record.properties["Recipe Database"].relation
      .map(({ id }: { id: string }) => {
        const score = gbs.find((s) => s.id === id);
        return score ? score.gbs : 0;
      })
      .filter((score: number) => score > 0),
    pageDetails: record.pageDetails?.results || [],
  };
  return ingredient;
}
