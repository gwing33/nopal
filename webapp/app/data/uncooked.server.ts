import { RecordId } from "surrealdb";
import {
  Data,
  AllQueryOptions,
  Collection,
  queryCollection,
  select,
} from "./generic.server";

export type ArtMedium =
  | "newspaper-clipping"
  | "print"
  | "betamax"
  | "view-master-reel"
  | "presentation";

export type Uncooked = Data & {
  type: ArtMedium;
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
