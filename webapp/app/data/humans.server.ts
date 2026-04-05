import { RecordId } from "surrealdb";
import {
  Data,
  Collection,
  query,
  select,
  formatRecord,
} from "./generic.server";

export type Role = "Super" | "Admin" | "Human";

export type Human = Data & {
  email: string;
  name: string;
  role: Role;
};

export type Humans = Collection<Human>;

export async function getHumans(): Promise<Humans | undefined> {
  return select<Human>(`humans`);
}

export async function getHumanByEmail(
  email: string
): Promise<Human | undefined> {
  const result = await query<[Human[]]>(
    `SELECT * FROM humans WHERE email = $email;`,
    {
      email,
    }
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}
