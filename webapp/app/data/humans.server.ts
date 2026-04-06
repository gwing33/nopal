import { RecordId } from "surrealdb";
import {
  Data,
  Collection,
  query,
  select,
  formatRecord,
  upsert,
  remove,
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

export async function createHuman(data: {
  email: string;
  name: string;
  role: Role;
}): Promise<Human | undefined> {
  const result = await upsert("humans", data);
  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as Human) : undefined;
}

export async function updateHuman(
  id: string,
  data: { email: string; name: string; role: Role }
): Promise<Human | undefined> {
  const result = await upsert(`humans:${id}`, data);
  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as Human) : undefined;
}

export async function deleteHuman(id: string): Promise<void> {
  await remove("humans", id);
}
