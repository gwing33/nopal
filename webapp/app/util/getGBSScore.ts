import type { MaterialRecord } from "../data/notion/types";

export function getGBSScore(material: MaterialRecord): number {
  return (
    material.comfortScore +
    material.efficiencyScore +
    material.longevityScore +
    material.socialImpactScore +
    material.carbonScore
  );
}
