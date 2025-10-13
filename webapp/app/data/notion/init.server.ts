// TODO: Find a better solution here
import { registerStoriesDb } from "./stories.server";
import { registerMaterialsDb } from "./materials.server";
import { registerAssembliesDb } from "./assemblies.server";
import { registerAppliedScienceDb } from "./science.server";

export function initDbs() {
  registerStoriesDb();
  registerMaterialsDb();
  registerAssembliesDb();
  registerAppliedScienceDb();
}
