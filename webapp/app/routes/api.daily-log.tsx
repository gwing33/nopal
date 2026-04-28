import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getDailyLogByDate,
  getDailyLogs,
  saveDailyLog,
} from "../data/dailyLog.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const humanId = url.searchParams.get("humanId");
  const date = url.searchParams.get("date") ?? undefined;
  const before = url.searchParams.get("before") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  if (!humanId) {
    return Response.json(
      { error: "Query parameter 'humanId' is required" },
      { status: 400 }
    );
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    return Response.json(
      { error: "Query parameter 'limit' must be a number between 1 and 100" },
      { status: 400 }
    );
  }

  try {
    // Single-entry lookup when a specific date is provided
    if (date) {
      const entry = await getDailyLogByDate(humanId, date);
      if (!entry) {
        return Response.json({ error: "Log entry not found" }, { status: 404 });
      }
      return Response.json(entry);
    }

    // Paginated list
    const result = await getDailyLogs(humanId, { before, limit });
    return Response.json(result);
  } catch (err) {
    console.error("GET /api/daily-log error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { humanId, date, content } = body as {
    humanId?: unknown;
    date?: unknown;
    content?: unknown;
  };

  if (!humanId || typeof humanId !== "string") {
    return Response.json(
      { error: "Field 'humanId' is required and must be a string" },
      { status: 400 }
    );
  }

  if (!date || typeof date !== "string") {
    return Response.json(
      { error: "Field 'date' is required and must be a YYYY-MM-DD string" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Field 'date' must be in YYYY-MM-DD format" },
      { status: 400 }
    );
  }

  if (typeof content !== "string") {
    return Response.json(
      { error: "Field 'content' is required and must be a string" },
      { status: 400 }
    );
  }

  try {
    const saved = await saveDailyLog(humanId, date, content);
    return Response.json(saved, { status: 200 });
  } catch (err) {
    console.error("POST /api/daily-log error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
