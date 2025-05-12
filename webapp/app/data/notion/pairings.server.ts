import { registerDb } from "./core.server";

const db = {
  id: "1d1f2211e45f80df81c3c82b831b45c1",
  dbName: "gbs_pairings_v2",
  getPublicUrl: (slug: string) => `/pairings/${slug}`,
};
export function registerPairingsDb() {
  registerDb(db);
}
