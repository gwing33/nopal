import type { EndpointProps } from "./docs.types";

export const dailyLogGet = {
  method: "GET",
  path: "/api/daily-log",
  summary: "List or look up daily log entries",
  description:
    "Without a date param returns a paginated list of entries for the given human (newest first). Pass date to retrieve the single entry for that day.",
  queryParams: [
    {
      name: "humanId",
      type: "string",
      required: true,
      description: "The human whose log entries to fetch.",
    },
    {
      name: "date",
      type: "string",
      required: false,
      description:
        "YYYY-MM-DD. When provided, returns the single entry for that date (404 if none).",
    },
    {
      name: "before",
      type: "string",
      required: false,
      description:
        "YYYY-MM-DD pagination cursor. Returns only entries with date strictly before this value.",
    },
    {
      name: "limit",
      type: "number",
      required: false,
      description:
        "Number of entries to return. Must be 1–100. Defaults to 10.",
    },
  ],
  responseExample: `// Paginated list (no date param)
{
  "entries": [
    {
      "_id": "daily_logs:h9xmq3z1_2025-05-01",
      "humanId": "h9xmq3z1",
      "date": "2025-05-01",
      "content": "## Morning\\nReviewed shop drawings.",
      "createdAt": "2025-05-01T08:00:00.000Z",
      "updatedAt": "2025-05-01T16:30:00.000Z"
    }
  ],
  "hasMore": false
}

// Single entry lookup (with ?date=2025-05-01)
{
  "_id": "daily_logs:h9xmq3z1_2025-05-01",
  "humanId": "h9xmq3z1",
  "date": "2025-05-01",
  "content": "## Morning\\nReviewed shop drawings.",
  ...
}`,
} satisfies EndpointProps;

export const dailyLogPost = {
  method: "POST",
  path: "/api/daily-log",
  summary: "Create or update a daily log entry",
  description:
    "Upserts a log entry for the given human and date. If an entry already exists for that date it is updated in place; otherwise a new one is created. Always returns 200.",
  requestBody: [
    {
      name: "humanId",
      type: "string",
      required: true,
      description: "The author's _id.",
    },
    {
      name: "date",
      type: "string",
      required: true,
      description: "YYYY-MM-DD local date string.",
    },
    {
      name: "content",
      type: "string",
      required: true,
      description: "Log body (markdown). May be an empty string.",
    },
  ],
  responseExample: `HTTP 200 OK
{
  "_id": "daily_logs:h9xmq3z1_2025-05-01",
  "humanId": "h9xmq3z1",
  "date": "2025-05-01",
  "content": "## Morning\\nReviewed shop drawings.",
  "createdAt": "2025-05-01T08:00:00.000Z",
  "updatedAt": "2025-05-01T16:30:00.000Z"
}`,
  notes: [
    "Always returns 200 — not 201 — regardless of whether a new entry was created or an existing one was updated.",
    "The record ID is deterministic: daily_logs:{humanId}_{date}, so the same human+date pair always resolves to the same record.",
    "date must match the regex /^\\d{4}-\\d{2}-\\d{2}$/ or the request returns 400.",
  ],
} satisfies EndpointProps;
