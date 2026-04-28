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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CalendarCollectionType = "human" | "project" | "named";

export type CalendarCollection = Data & {
  name: string;
  type: CalendarCollectionType;
  refId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type CalendarCollections = Collection<CalendarCollection>;

export type CalendarCollectionInput = {
  name: string;
  type: CalendarCollectionType;
  refId?: string;
  createdBy: string;
};

export type CalendarType = "internal" | "google";

export type Calendar = Data & {
  collectionId: string;
  name: string;
  description?: string;
  type: CalendarType;
  color?: string;
  googleCalendarId?: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type Calendars = Collection<Calendar>;

export type CalendarInput = {
  collectionId: string;
  name: string;
  description?: string;
  type: CalendarType;
  color?: string;
  googleCalendarId?: string;
  timezone?: string;
  isActive?: boolean;
  createdBy: string;
};

// ---------------------------------------------------------------------------
// Calendar Collection CRUD
// ---------------------------------------------------------------------------

export async function getCalendarCollections(): Promise<
  CalendarCollections | undefined
> {
  return select<CalendarCollection>("calendar_collections");
}

export async function getCalendarCollectionById(
  id: string
): Promise<CalendarCollection | undefined> {
  const result = await query<[CalendarCollection[]]>(
    `SELECT * FROM calendar_collections WHERE id = $id;`,
    { id: new RecordId("calendar_collections", id) }
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}

export async function getCalendarCollectionsByType(
  type: CalendarCollectionType,
  refId?: string
): Promise<CalendarCollection[]> {
  const result = await getCalendarCollections();
  const all = result?.data ?? [];
  return all.filter(
    (col) => col.type === type && (refId === undefined || col.refId === refId)
  );
}

export async function createCalendarCollection(
  data: CalendarCollectionInput
): Promise<CalendarCollection | undefined> {
  const now = new Date().toISOString();

  const result = await upsert("calendar_collections", {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record
    ? formatRecord(record as unknown as CalendarCollection)
    : undefined;
}

export async function updateCalendarCollection(
  id: string,
  data: Partial<Omit<CalendarCollectionInput, "createdBy">>
): Promise<CalendarCollection | undefined> {
  const existing = await getCalendarCollectionById(id);
  if (!existing) return undefined;
  const { id: _, ...rest } = existing;

  const result = await upsert(new RecordId("calendar_collections", id), {
    ...rest,
    ...data,
    updatedAt: new Date().toISOString(),
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record
    ? formatRecord(record as unknown as CalendarCollection)
    : undefined;
}

export async function deleteCalendarCollection(id: string): Promise<void> {
  await remove("calendar_collections", id);
}

// ---------------------------------------------------------------------------
// Calendar CRUD
// ---------------------------------------------------------------------------

export async function getCalendars(): Promise<Calendars | undefined> {
  return select<Calendar>("calendars");
}

export async function getCalendarById(
  id: string
): Promise<Calendar | undefined> {
  const result = await query<[Calendar[]]>(
    `SELECT * FROM calendars WHERE id = $id;`,
    { id: new RecordId("calendars", id) }
  );

  const record = result?.[0]?.[0] || undefined;
  return record ? formatRecord(record) : undefined;
}

export async function getCalendarsByCollectionId(
  collectionId: string
): Promise<Calendar[]> {
  const result = await query<[Calendar[]]>(
    `SELECT * FROM calendars WHERE collectionId = $collectionId ORDER BY name ASC;`,
    { collectionId }
  );

  return (result?.[0] ?? []).map(formatRecord);
}

export async function createCalendar(
  data: CalendarInput
): Promise<Calendar | undefined> {
  const now = new Date().toISOString();

  const result = await upsert("calendars", {
    timezone: "UTC",
    isActive: true,
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as Calendar) : undefined;
}

export async function updateCalendar(
  id: string,
  data: Partial<Omit<CalendarInput, "createdBy" | "collectionId">>
): Promise<Calendar | undefined> {
  const existing = await getCalendarById(id);
  if (!existing) return undefined;
  const { id: _, ...rest } = existing;

  const result = await upsert(new RecordId("calendars", id), {
    ...rest,
    ...data,
    updatedAt: new Date().toISOString(),
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as Calendar) : undefined;
}

export async function deleteCalendar(id: string): Promise<void> {
  await remove("calendars", id);
}
