import type { MaterialRecord } from "./notion/types";

export function isPublished(material: MaterialRecord): boolean {
  return material.status === "published";
}
