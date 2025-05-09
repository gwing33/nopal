import type { IngredientRecord } from "./notion/types";

export function isPublished(ingredient: IngredientRecord): boolean {
  return ingredient.status === "published";
}

export function isFavorite(ingredient: IngredientRecord): boolean {
  return ingredient.recommendation === "Nopal Favorite";
}
