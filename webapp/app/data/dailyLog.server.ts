import { RecordId } from "surrealdb";
import { Data, query, formatRecord, upsert } from "./generic.server";

export type DailyLog = Data & {
  humanId: string;
  date: string; // YYYY-MM-DD local date string from user's device
  content: string;
  createdAt: string;
  updatedAt: string;
};

// Stable record ID: "daily_logs:${humanId}_${date}"
function logRecordId(humanId: string, date: string): RecordId {
  return new RecordId("daily_logs", `${humanId}_${date}`);
}

// Get a single entry by humanId + date
export async function getDailyLogByDate(
  humanId: string,
  date: string
): Promise<DailyLog | undefined> {
  const result = await query<[DailyLog[]]>(
    `SELECT * FROM daily_logs WHERE humanId = $humanId AND date = $date LIMIT 1;`,
    { humanId, date }
  );
  const record = result?.[0]?.[0];
  return record ? formatRecord(record) : undefined;
}

// Get paginated entries (newest first). Pass `before` (YYYY-MM-DD) to page backwards.
export async function getDailyLogs(
  humanId: string,
  { before, limit = 10 }: { before?: string; limit?: number } = {}
): Promise<{ entries: DailyLog[]; hasMore: boolean }> {
  const queryStr = before
    ? `SELECT * FROM daily_logs WHERE humanId = $humanId AND date < $before ORDER BY date DESC LIMIT $limit;`
    : `SELECT * FROM daily_logs WHERE humanId = $humanId ORDER BY date DESC LIMIT $limit;`;

  const result = await query<[DailyLog[]]>(queryStr, {
    humanId,
    ...(before ? { before } : {}),
    limit: limit + 1, // request one extra to determine hasMore
  });

  const rows = result?.[0] ?? [];
  const hasMore = rows.length > limit;
  return {
    entries: hasMore ? rows.slice(0, limit).map(formatRecord) : rows.map(formatRecord),
    hasMore,
  };
}

// Upsert a daily log entry for the given humanId + date
export async function saveDailyLog(
  humanId: string,
  date: string,
  content: string
): Promise<DailyLog | undefined> {
  const id = logRecordId(humanId, date);
  const now = new Date().toISOString();
  const existing = await getDailyLogByDate(humanId, date);

  const result = await upsert(id, {
    humanId,
    date,
    content,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  const record = Array.isArray(result) ? result[0] : result;
  return record ? formatRecord(record as unknown as DailyLog) : undefined;
}
