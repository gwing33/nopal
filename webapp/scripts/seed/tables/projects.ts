import type { Project } from "../../../app/data/projects.server";
import type { SeedTable, SeedRecord } from "../index";

type ProjectSeed = SeedRecord<Project>;

export const projectsSeed: SeedTable<Project> = {
  table: "projects",
  records: [
    {
      id: "sunny_1",
      name: "Sunny",
      address: "9 E Foothill Dr. Phoenix AZ 85020",
      northStar: "Building focused on health, comfort and simplicity",
      type: "Design+Build",
      phases: [],
      humans: [
        { humanId: "super_1", role: "Guide" },
        { humanId: "admin_1", role: "Guide" },
      ],
      costRange: [700000, 800000],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "super_1",
      updatedBy: "super_1",
    },
  ] satisfies ProjectSeed[],
};
