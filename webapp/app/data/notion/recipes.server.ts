import { registerDb } from "./core.server";

const db = {
  id: "1d6f2211e45f803a880dcbd7701ec65d",
  dbName: "gbs_recipes_v2",
};
export function registerRecipesDb() {
  registerDb(db);
}
