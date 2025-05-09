import { registerDb } from "./core.server";

const db = {
  id: "1d1f2211e45f80a7a7a7e2ecb09ff6da",
  dbName: "gbs_ingredients_v2",
};
export function registerIngredientsDb() {
  registerDb(db);
}
