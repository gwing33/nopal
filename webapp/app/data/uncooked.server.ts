import { RecordId } from "surrealdb";
import { getDb } from "./db.server";
import {
  Data,
  AllQueryOptions,
  Collection,
  queryCollection,
  select,
  formatRecord,
  query,
} from "./generic.server";

export type ArtMedium =
  | "newspaper-clipping"
  | "print"
  | "betamax"
  | "view-master-reel"
  | "presentation";

export type Uncooked = Data & {
  type: ArtMedium;
  type_id: number;
  title: string;
  author: string;
  date: string;
  body: string;
  externalUrl?: string;
  images?: string[];
};

export type AllUncooked = Collection<Uncooked>;

export async function getAllUncooked(
  options: AllQueryOptions = {}
): Promise<AllUncooked> {
  return queryCollection(
    `SELECT * FROM uncooked ORDER BY ${
      options.order || "date"
    } DESC LIMIT $limit START AT $start;`,
    {},
    options
  );
}

export async function getUncookedById(
  id: string
): Promise<Uncooked | undefined> {
  return select(new RecordId("uncooked", id));
}

export type CreateUncookedParams = Omit<
  Uncooked,
  "id" | "_id" | "type_id" | "date"
>;

export async function createUncooked(
  params: CreateUncookedParams
): Promise<Uncooked> {
  if (!params.type || !params.title || !params.author || !params.body) {
    throw new Error("Missing required fields");
  }

  try {
    const db = await getDb();

    // Get the last ID that way we can increment it.
    const last = await query<[[{ type_id: number }]]>(
      "SELECT type, type_id FROM uncooked WHERE type = $type ORDER BY type_id DESC LIMIT 1;",
      { type: params.type }
    );
    const lastId = last?.[0]?.[0]?.type_id || 0;
    const newId = lastId + 1;

    const created = await db.create("uncooked", {
      ...params,
      id: new RecordId("uncooked", `${params.type}-no-${newId}`),
      type_id: newId,
      date: new Date(),
    });
    const newRecord = created?.[0];

    if (!newRecord) {
      throw new Error("Failed to create uncooked record");
    }

    return formatRecord(newRecord) as Uncooked;
  } catch (error) {
    console.error("Error creating uncooked record:", error);
    throw error;
  }
}
