import {
  registerDb,
  getAllPublishedPagesByDbRef,
  getPageByDbRefAndSlug,
} from "./core.server";
import type { IngredientRecord } from "./types";
import { formatRecord } from "../generic.server";
import { getGBSScore } from "../../util/getGBSScore";

const db = {
  id: "1d6f2211e45f803a880dcbd7701ec65d",
  dbName: "gbs_recipes_v2",
  getPublicUrl: (slug: string) => `/recipes/${slug}`,
};
export function registerRecipesDb() {
  registerDb(db);
}

export async function getAllRecipes(): Promise<{
  data: IngredientRecord[];
}> {
  const results = await getAllPublishedPagesByDbRef(db.dbName);

  return {
    data: results.map(({ page }) => formatRecipeRecord(page)),
  };
}

export async function getRecipeBySlug(slug: string) {
  const record = await getPageByDbRefAndSlug(db.dbName, slug);
  if (record) {
    return formatRecipeRecord(record);
  }
  return null;
}

function formatRecipeRecord(_record: any): IngredientRecord {
  const record = formatRecord(_record);
  const recipe = {
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
    svg: record.properties["svg"]?.files?.[0]?.file?.url || "",
    pageDetails: record.pageDetails?.results || [],
  };
  recipe.gbs = getGBSScore(recipe);
  return recipe;
}
