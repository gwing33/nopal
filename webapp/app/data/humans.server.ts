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

export type Role = "Super" | "Admin" | "Human" | "MaybeHuman";

export type OfficeHoursEntry = {
  enabled: boolean;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
};

export type OfficeHours = {
  monday: OfficeHoursEntry;
  tuesday: OfficeHoursEntry;
  wednesday: OfficeHoursEntry;
  thursday: OfficeHoursEntry;
  friday: OfficeHoursEntry;
  saturday: OfficeHoursEntry;
  sunday: OfficeHoursEntry;
};

export type ScheduledEvent = {
  id: string;
  name: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
};

export type Human = Data & {
  email: string;
  name: string;
  role: Role;
  pfp?: string; // URL to profile picture
  officeHours?: OfficeHours;
  scheduledEvents?: ScheduledEvent[];
};

export type Humans = Collection<Human>;

export const DEFAULT_OFFICE_HOURS: OfficeHours = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: false, start: "09:00", end: "17:00" },
  sunday: { enabled: false, start: "09:00", end: "17:00" },
};

export async function getHumans(): Promise<Humans | undefined> {
  return select<Human>(`humans`);
}

export async function getHumanByEmail(
  email: string,
): Promise<Human | undefined> {
  const result = await query<[Human[]]>(
    `SELECT * FROM humans WHERE email = $email;`,
    {
      email,
    },
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}

export async function getHumanById(id: string): Promise<Human | undefined> {
  const result = await query<[Human[]]>(
    `SELECT * FROM humans WHERE id = $id;`,
    { id: new RecordId("humans", id) },
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
  data: { email: string; name: string; role: Role },
): Promise<Human | undefined> {
  const result = await upsert(`humans:${id}`, data);
  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as Human) : undefined;
}

export async function patchHuman(
  id: string,
  data: {
    name?: string;
    pfp?: string;
    officeHours?: OfficeHours;
    scheduledEvents?: ScheduledEvent[];
  },
): Promise<Human | undefined> {
  const result = await query<[Human[]]>(
    `UPDATE type::thing("humans", $id) MERGE $data RETURN AFTER;`,
    { id, data },
  );
  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}

export async function deleteHuman(id: string): Promise<void> {
  await remove("humans", id);
}
