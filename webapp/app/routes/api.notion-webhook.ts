import { json, type ActionFunctionArgs } from "@remix-run/node";
import {
  syncSinglePage,
  syncAllDatabases,
  syncDatabaseByName,
  syncRecentlyEdited,
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
 *   Manual trigger — incremental sync (pages edited recently):
 *     { "syncRecent": true }
 *     { "syncRecent": true, "windowMinutes": 30 }
 *
 *   Manual trigger — full sync of all databases:
 *     { "syncAll": true }
 *
 * Cron-friendly GET endpoint (for scheduled polling):
 *   GET /api/notion-webhook?cron=1
 *   GET /api/notion-webhook?cron=1&window=30
 *   (requires Authorization header, same as POST)
 *
 * Environment variables:
 *   NOTION_WEBHOOK_SECRET — shared secret for authenticating webhook calls
 */

function unauthorized(reason: string) {
  console.log(`[webhook] ✗ Unauthorized: ${reason}`);
  return json({ error: "Unauthorized" }, { status: 401 });
}

function verifySecret(request: Request): { ok: boolean; reason: string } {
  const secret = process.env.NOTION_WEBHOOK_SECRET;
  if (!secret) {
    return {
      ok: false,
      reason:
        "NOTION_WEBHOOK_SECRET env var is not set — webhook endpoint is disabled",
    };
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return { ok: false, reason: "Missing Authorization header" };
  }

  // Support "Bearer <token>" or plain "<token>"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (token !== secret) {
    return {
      ok: false,
      reason: `Token mismatch (received ${token.length} chars, expected ${secret.length} chars)`,
    };
  }

  return { ok: true, reason: "" };
}

// GET /api/notion-webhook — not supported
export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);

  // GET /api/notion-webhook?cron=1 — lightweight cron-friendly endpoint
  if (url.searchParams.has("cron")) {
    console.log("[webhook] Cron ping received via GET");

    const auth = verifySecret(request);
    if (!auth.ok) {
      return unauthorized(auth.reason);
    }

    const windowMinutes = Number(url.searchParams.get("window")) || undefined;
    console.log(
      `[webhook] Cron: running incremental sync (window: ${
        windowMinutes ?? "default"
      }min)`
    );
    const result = await syncRecentlyEdited(windowMinutes);
    console.log(
      `[webhook] Cron result: ${result.result}, synced: ${result.synced}`
    );
    return json({ action: "syncRecent", ...result });
  }

  console.log("[webhook] Received GET request without ?cron — returning 405");
  return json(
    { status: "ok", method: "GET not supported — use POST" },
    { status: 405 }
  );
}

export async function action({ request }: ActionFunctionArgs) {
  console.log(
    `[webhook] ▶ Incoming ${request.method} from ${
      request.headers.get("user-agent") || "unknown agent"
    }`
  );

  if (request.method !== "POST") {
    console.log(`[webhook] ✗ Rejected: method ${request.method} not allowed`);
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  // --- Auth ---
  const auth = verifySecret(request);
  if (!auth.ok) {
    return unauthorized(auth.reason);
  }
  console.log("[webhook] ✓ Auth passed");

  // --- Parse body ---
  let body: Record<string, unknown>;
  let rawText: string;
  try {
    rawText = await request.text();
    console.log(
      `[webhook] Raw body (${rawText.length} chars): ${rawText.slice(0, 500)}`
    );
    body = JSON.parse(rawText);
  } catch (e) {
    console.log(`[webhook] ✗ Failed to parse JSON body: ${e}`);
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log(`[webhook] Parsed body keys: ${Object.keys(body).join(", ")}`);

  // --- Incremental sync (recently edited pages) ---
  if (body.syncRecent === true) {
    const windowMinutes =
      typeof body.windowMinutes === "number" ? body.windowMinutes : undefined;
    console.log(
      `[webhook] Action: syncRecent (window: ${windowMinutes ?? "default"}min)`
    );
    const result = await syncRecentlyEdited(windowMinutes);
    console.log(
      `[webhook] syncRecent result: ${result.result}, synced: ${result.synced}`
    );
    return json({ action: "syncRecent", ...result });
  }

  // --- Full sync ---
  if (body.syncAll === true) {
    console.log("[webhook] Action: full syncAll");
    const result = await syncAllDatabases();
    console.log(`[webhook] syncAll result: ${result}`);
    return json({ action: "syncAll", result });
  }

  // --- Database-level sync ---
  if (typeof body.database === "string" && body.database) {
    console.log(`[webhook] Action: syncDatabase "${body.database}"`);
    const result = await syncDatabaseByName(body.database);
    console.log(`[webhook] syncDatabase result: ${result}`);
    return json({ action: "syncDatabase", database: body.database, result });
  }

  // --- Single page sync ---
  const pageId = resolvePageId(body);

  if (pageId) {
    console.log(`[webhook] Action: syncPage "${pageId}"`);
    const result = await syncSinglePage(pageId);
    console.log(`[webhook] syncPage result: ${result}`);
    return json({ action: "syncPage", pageId, result });
  }

  // --- Could not determine action ---
  console.log(
    `[webhook] ✗ Could not resolve action from body. Top-level keys: ${Object.keys(
      body
    ).join(", ")}` +
      (body.data
        ? ` | data keys: ${Object.keys(body.data as object).join(", ")}`
        : " | no 'data' key")
  );

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
    console.log(`[webhook] Resolved pageId from body.pageId: ${body.pageId}`);
    return body.pageId;
  }

  // Notion automation payload: data.id
  if (body.data && typeof body.data === "object") {
    const data = body.data as Record<string, unknown>;
    console.log(
      `[webhook] Inspecting body.data — keys: ${Object.keys(data).join(", ")}`
    );
    if (typeof data.id === "string" && data.id) {
      console.log(`[webhook] Resolved pageId from body.data.id: ${data.id}`);
      return data.id;
    }
  }

  console.log("[webhook] Could not resolve any pageId from body");
  return null;
}
