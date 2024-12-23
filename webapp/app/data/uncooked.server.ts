import { RecordId } from "surrealdb";
import {
  Data,
  AllQueryOptions,
  Collection,
  query,
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
  instagramId?: string;
  customImage?: string;
  images?: string[];
};

export type AllUncooked = Collection<Uncooked>;

export async function getAllUncooked(
  options: AllQueryOptions = {}
): Promise<AllUncooked> {
  return query(
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
