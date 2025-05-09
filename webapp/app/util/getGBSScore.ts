import type { IngredientRecord } from "../data/notion/types";

export function getGBSScore(ingredient: IngredientRecord): number {
  return (
    ingredient.comfortScore +
    ingredient.efficiencyScore +
    ingredient.longevityScore +
    ingredient.socialImpactScore +
    ingredient.carbonScore
  );
}
