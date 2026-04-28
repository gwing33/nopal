import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getCalendarById,
  updateCalendar,
  deleteCalendar,
} from "../data/calendars.server";

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
    const calendar = await getCalendarById(id);
    if (!calendar) {
      return Response.json({ error: "Calendar not found" }, { status: 404 });
    }
    return Response.json(calendar);
  } catch (err) {
    console.error("GET /api/calendar/calendars/:id error:", err);
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
      await deleteCalendar(id);
      return Response.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/calendar/calendars/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  if (request.method === "PUT") {
    let body: {
      name?: string;
      description?: string;
      type?: "internal" | "google";
      color?: string;
      googleCalendarId?: string;
      timezone?: string;
      isActive?: boolean;
    };

    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, description, type, color, googleCalendarId, timezone, isActive } = body;

    try {
      const updated = await updateCalendar(id, {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(color !== undefined && { color }),
        ...(googleCalendarId !== undefined && { googleCalendarId }),
        ...(timezone !== undefined && { timezone }),
        ...(isActive !== undefined && { isActive }),
      });

      if (!updated) {
        return Response.json({ error: "Calendar not found" }, { status: 404 });
      }

      return Response.json(updated);
    } catch (err) {
      console.error("PUT /api/calendar/calendars/:id error:", err);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
