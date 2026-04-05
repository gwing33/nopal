import type { Human } from "../../../app/data/humans.server";
import type { SeedTable, SeedRecord } from "../index";

type HumanSeed = SeedRecord<Human>;

export const humansSeed: SeedTable<Human> = {
  table: "humans",
  records: [
    {
      id: "super_1",
      name: "Gerald L",
      email: "super@example.com",
      role: "Super",
    },
    {
      id: "admin_1",
      name: "Austin T",
      email: "admin@example.com",
      role: "Admin",
    },
    {
      id: "human_1",
      name: "Lucas J",
      email: "human@example.com",
      role: "Human",
    },
  ] satisfies HumanSeed[],
};
