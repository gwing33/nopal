import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getCalendarCollections,
  getCalendarCollectionsByType,
  createCalendarCollection,
  type CalendarCollectionType,
} from "../data/calendars.server";

const VALID_COLLECTION_TYPES: CalendarCollectionType[] = [
  "human",
  "project",
  "named",
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type") as CalendarCollectionType | null;
    const refId = url.searchParams.get("refId") ?? undefined;

    if (type) {
      const results = await getCalendarCollectionsByType(type, refId);
      return Response.json({ data: results });
    }

    const result = await getCalendarCollections();
    return Response.json(result);
  } catch (err) {
    console.error("GET /api/calendar/collections error:", err);
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

  const { name, type, refId } = body as {
    name?: unknown;
    type?: unknown;
    refId?: unknown;
  };

  if (!name || typeof name !== "string") {
    return Response.json(
      { error: "Field 'name' is required and must be a string" },
      { status: 400 }
    );
  }

  if (!type || !VALID_COLLECTION_TYPES.includes(type as CalendarCollectionType)) {
    return Response.json(
      {
        error: `Field 'type' must be one of: ${VALID_COLLECTION_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  try {
    const created = await createCalendarCollection({
      name,
      type: type as CalendarCollectionType,
      refId: typeof refId === "string" ? refId : undefined,
      createdBy: user._id,
    });

    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/calendar/collections error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
