import { RecordId } from "surrealdb";
import { getDb } from "./db.server";

export type AllQueryOptions = {
  order?: "date" | "title";
  limit?: number;
  start?: number;
};

export type Data = {
  id: { tb: string; id: string };
  _id: string;
};

export type Collection<T> = {
  data: T[];
  metadata: {
    nextStart: number | null;
  };
};

const DEFAULT_LIMIT = 5;

export function formatRecord<T extends Data>(data: T) {
  return {
    ...data,
    _id: data.id.toString(),
    id: { tb: data.id.tb, id: data.id.id },
  };
}

// Helps keep collection response consistent, handles extra pagination.
export function formatCollection<T extends Data>(
  data: T[] = [],
  { start = 0, limit = DEFAULT_LIMIT }: AllQueryOptions = {}
): Collection<T> {
  if (!data.length) {
    return {
      metadata: { nextStart: null },
      data: [],
    };
  }

  const nextStart = data.length > limit ? start + limit : null;
  return {
    metadata: { nextStart },
    data: data.reduce((acc: T[], d: T, i: number) => {
      if (i >= limit) {
        return acc;
      }
      return acc.concat(formatRecord(d));
    }, []),
  };
}

export async function query<T extends Data>(
  query: string,
  params: Record<string, any> = {},
  options: AllQueryOptions = {}
): Promise<Collection<T>> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return formatCollection();
  }

  try {
    const { limit = DEFAULT_LIMIT, start = 0 } = options;
    const result = await db.query<[T[]]>(query, {
      ...params,
      limit: limit + 1,
      start,
    });
    return formatCollection(result?.[0] || [], { start, limit });
  } catch (err) {
    console.error("Failed to get data:", err);
  } finally {
    await db.close();
  }
  return formatCollection();
}

export async function select<T extends Data>(
  id: RecordId
): Promise<T | undefined> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return undefined;
  }

  try {
    const result = await db.select<T>(id);
    return result ? formatRecord(result) : undefined;
  } catch (err) {
    console.error("Failed to get data:", err);
  } finally {
    await db.close();
  }
  return undefined;
}
