// TODO: Find a better solution here
import { registerMaterialsDb } from "./materials.server";
import { registerAssembliesDb } from "./assemblies.server";
import { registerAppliedScienceDb } from "./science.server";

export function initDbs() {
  registerMaterialsDb();
  registerAssembliesDb();
  registerAppliedScienceDb();
}
