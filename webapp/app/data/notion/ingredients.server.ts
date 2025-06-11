import {
  registerDb,
  getAllPublishedPagesByDbRef,
  getPageByDbRefAndSlug,
} from "./core.server";
import type { IngredientRecord } from "./types";
import { formatRecord } from "../generic.server";
import { getGBSScore } from "../../util/getGBSScore";

const db = {
  id: "1d1f2211e45f80a7a7a7e2ecb09ff6da",
  dbName: "gbs_ingredients_v2",
  getPublicUrl: (slug: string) => `/ingredients/${slug}`,
};
export function registerIngredientsDb() {
  registerDb(db);
}

export async function getAllIngredients(): Promise<{
  data: IngredientRecord[];
}> {
  const results = await getAllPublishedPagesByDbRef(db.dbName);

  return {
    data: results.map(({ page }) => formatIngredientRecord(page)),
  };
}

export async function getIngredientBySlug(slug: string) {
  const record = await getPageByDbRefAndSlug(db.dbName, slug);
  if (record) {
    return formatIngredientRecord(record);
  }
  return null;
}

function formatIngredientRecord(_record: any): IngredientRecord {
  const record = formatRecord(_record);
  const ingredient: IngredientRecord = {
    id: record.id,
    _id: record._id,
    name: record.properties.Name.title[0]?.plain_text || "",
    slug: record.properties.Slug.rich_text[0]?.plain_text || "",
    summary: record.properties.Summary,
    status: record.properties.Status.select?.name || "",
    recommendation: record.properties.Recommendation.select?.name || "",
    gbs: 0,
    comfortScore: record.properties["Comfort Score"].number,
    efficiencyScore: record.properties["Efficiency Score"].number,
    longevityScore: record.properties["Longevity Score"].number,
    socialImpactScore: record.properties["Social Impact Score"].number,
    carbonScore: record.properties["Carbon Score"].number,
    svg: record.properties["svg"].files?.[0]?.file?.url || "",
    pageDetails: record.pageDetails?.results || [],
  };
  ingredient.gbs = getGBSScore(ingredient);
  return ingredient;
}
