import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getCalendarsByCollectionId,
  createCalendar,
} from "../data/calendars.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { collectionId } = params;

  try {
    const results = await getCalendarsByCollectionId(collectionId!);
    return Response.json({ data: results });
  } catch (err) {
    console.error("Failed to fetch calendars:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { collectionId } = params;

  let body: {
    name?: unknown;
    type?: unknown;
    description?: unknown;
    color?: unknown;
    googleCalendarId?: unknown;
    timezone?: unknown;
    isActive?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, type, description, color, googleCalendarId, timezone, isActive } = body;

  if (!name || typeof name !== "string") {
    return Response.json(
      { error: "Field 'name' is required and must be a string" },
      { status: 400 }
    );
  }

  const validTypes = ["internal", "google"] as const;
  if (!type || !validTypes.includes(type as (typeof validTypes)[number])) {
    return Response.json(
      { error: "Field 'type' must be one of: internal, google" },
      { status: 400 }
    );
  }

  try {
    const created = await createCalendar({
      collectionId: collectionId!,
      name,
      type: type as "internal" | "google",
      description: typeof description === "string" ? description : undefined,
      color: typeof color === "string" ? color : undefined,
      googleCalendarId:
        typeof googleCalendarId === "string" ? googleCalendarId : undefined,
      timezone: typeof timezone === "string" ? timezone : undefined,
      isActive: typeof isActive === "boolean" ? isActive : undefined,
      createdBy: user._id,
    });

    return Response.json(created, { status: 201 });
  } catch (err) {
    console.error("Failed to create calendar:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
