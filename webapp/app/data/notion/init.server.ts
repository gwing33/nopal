// TODO: Find a better solution here
import { registerIngredientsDb } from "./ingredients.server";
import { registerRecipesDb } from "./recipes.server";
import { registerPairingsDb } from "./pairings.server";

export function initDbs() {
  registerIngredientsDb();
  registerRecipesDb();
  registerPairingsDb();
}
