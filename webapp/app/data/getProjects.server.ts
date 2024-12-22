import { getDb } from "./db.server";
import { jsonify } from "surrealdb";

export type ArtMedium =
  | "newspaper-clipping"
  | "print"
  | "betamax"
  | "view-master-reel"
  | "presentation";

export type Project = {
  id: string;
  type: ArtMedium;
  title: string;
  author: string;
  date: string;
  body: string;
  externalHref?: string;
  instagramId?: string;
  customImage?: string;
  images?: string[];
};
export type Projects = {
  projects: Project[];
};

export async function getProjects(): Promise<Projects | undefined> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return undefined;
  }

  try {
    const projects = await db.select<Project>("uncooked");
    return projects ? { projects: jsonify(projects) } : undefined;
  } catch (err) {
    console.error("Failed to get projects:", err);
    return undefined;
  } finally {
    await db.close();
  }
}
