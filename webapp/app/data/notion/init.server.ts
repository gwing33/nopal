// TODO: Find a better solution here
import { registerIngredientsDb } from "./ingredients.server";
import { registerRecipesDb } from "./recipes.server";
import { registerTastingsDb } from "./tastings.server";

export function initDbs() {
  registerIngredientsDb();
  registerRecipesDb();
  registerTastingsDb();
}
