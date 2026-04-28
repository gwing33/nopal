import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getCalendarCollectionById,
  updateCalendarCollection,
  deleteCalendarCollection,
} from "../data/calendars.server";
import type { CalendarCollectionType } from "../data/calendars.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const collection = await getCalendarCollectionById(id);
    if (!collection) {
      return Response.json({ error: "Collection not found" }, { status: 404 });
    }
    return Response.json(collection);
  } catch (err) {
    console.error("GET /api/calendar/collections/:id error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  if (request.method === "DELETE") {
    try {
      await deleteCalendarCollection(id);
      return Response.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/calendar/collections/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  if (request.method === "PUT") {
    let body: { name?: string; type?: CalendarCollectionType; refId?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, type, refId } = body;

    if (type !== undefined && !["human", "project", "named"].includes(type)) {
      return Response.json(
        { error: "type must be one of: human, project, named" },
        { status: 400 }
      );
    }

    try {
      const updated = await updateCalendarCollection(id, { name, type, refId });
      if (!updated) {
        return Response.json({ error: "Collection not found" }, { status: 404 });
      }
      return Response.json(updated);
    } catch (err) {
      console.error("PUT /api/calendar/collections/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
