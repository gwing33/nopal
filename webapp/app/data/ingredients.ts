import type { IngredientRecord } from "./notion.server";

export function isPublished(ingredient: IngredientRecord): boolean {
  return ingredient.status === "published";
}

export function isFavorite(ingredient: IngredientRecord): boolean {
  return ingredient.recommendation === "Nopal Favorite";
}
