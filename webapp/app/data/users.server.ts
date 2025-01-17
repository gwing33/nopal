import { RecordId } from "surrealdb";
import {
  Data,
  Collection,
  query,
  select,
  formatRecord,
} from "./generic.server";

export type User = Data & {
  email: string;
  name: string;
};

export type Users = Collection<User>;

export async function getUsers(): Promise<Users | undefined> {
  return select<User>(`users`);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await query<[User[]]>(
    `SELECT * FROM users WHERE email = $email;`,
    {
      email,
    }
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}
