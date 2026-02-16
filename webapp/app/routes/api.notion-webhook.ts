import { json, type ActionFunctionArgs } from "@remix-run/node";
import {
  syncSinglePage,
  syncAllDatabases,
  syncDatabaseByName,
} from "../data/notion/sync.server";

/**
 * Notion Webhook Endpoint
 *
 * Receives webhook calls from Notion automations to keep local data in sync.
 * Secured via a shared secret passed in the Authorization header.
 *
 * Setup in Notion:
 *   1. Open a database → Automations → Add automation
 *   2. Trigger: "When page is added" or "When property is edited"
 *   3. Action: "Send webhook"
 *   4. URL: https://<your-domain>/api/notion-webhook
 *   5. Add header: Authorization: Bearer <NOTION_WEBHOOK_SECRET>
 *
 * Supported POST body shapes:
 *
 *   Notion automation payload (page-level sync):
 *     { "data": { "id": "<page-id>", ... } }
 *
 *   Manual trigger — sync a single page:
 *     { "pageId": "<page-id>" }
 *
 *   Manual trigger — sync a specific database by local name:
 *     { "database": "gbs_materials" }
 *
 *   Manual trigger — full sync of all databases:
 *     { "syncAll": true }
 *
 * Environment variables:
 *   NOTION_WEBHOOK_SECRET — shared secret for authenticating webhook calls
 */

function unauthorized() {
  return json({ error: "Unauthorized" }, { status: 401 });
}

function verifySecret(request: Request): boolean {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "NOTION_WEBHOOK_SECRET is not set — webhook endpoint is disabled"
    );
    return false;
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  // Support "Bearer <token>" or plain "<token>"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  return token === secret;
}

// Only POST is supported
export async function loader() {
  return json({ status: "ok", method: "GET not supported — use POST" }, { status: 405 });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  if (!verifySecret(request)) {
    return unauthorized();
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // --- Full sync ---
  if (body.syncAll === true) {
    console.log("[webhook] Full sync requested");
    const result = await syncAllDatabases();
    return json({ action: "syncAll", result });
  }

  // --- Database-level sync ---
  if (typeof body.database === "string" && body.database) {
    console.log(`[webhook] Database sync requested: ${body.database}`);
    const result = await syncDatabaseByName(body.database);
    return json({ action: "syncDatabase", database: body.database, result });
  }

  // --- Single page sync ---
  // Resolve the page ID from various payload shapes
  const pageId = resolvePageId(body);

  if (pageId) {
    console.log(`[webhook] Page sync requested: ${pageId}`);
    const result = await syncSinglePage(pageId);
    return json({ action: "syncPage", pageId, result });
  }

  return json(
    {
      error:
        'Could not determine action. Provide "pageId", "data.id", "database", or "syncAll".',
    },
    { status: 400 }
  );
}

/**
 * Extract a Notion page ID from the webhook payload.
 *
 * Notion automation webhooks send:
 *   { "source": {...}, "data": { "id": "page-id", ... } }
 *
 * We also support a simple manual shape:
 *   { "pageId": "page-id" }
 */
function resolvePageId(body: Record<string, unknown>): string | null {
  // Direct pageId field
  if (typeof body.pageId === "string" && body.pageId) {
    return body.pageId;
  }

  // Notion automation payload: data.id
  if (body.data && typeof body.data === "object") {
    const data = body.data as Record<string, unknown>;
    if (typeof data.id === "string" && data.id) {
      return data.id;
    }
  }

  return null;
}
