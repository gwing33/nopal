import { redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Layout } from "../components/Layout";
import { getUser } from "../modules/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");
  return { user };
}

// ---------------------------------------------------------------------------
// Design primitives
// ---------------------------------------------------------------------------

const METHOD_STYLES: Record<string, { bg: string; color: string }> = {
  GET: { bg: "var(--green)", color: "#fff" },
  POST: { bg: "var(--purple-light)", color: "#fff" },
  PUT: { bg: "#b07d1a", color: "#fff" },
  DELETE: { bg: "var(--red)", color: "#fff" },
};

function MethodBadge({
  method,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE";
}) {
  const s = METHOD_STYLES[method];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontFamily: "monospace",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "2px 7px",
        borderRadius: "4px",
        flexShrink: 0,
      }}
    >
      {method}
    </span>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "monospace",
        fontSize: "0.85em",
        background: "rgba(127,91,139,0.10)",
        padding: "1px 5px",
        borderRadius: "3px",
      }}
    >
      {children}
    </code>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre
      style={{
        background: "var(--purple)",
        color: "var(--yellow-light)",
        fontFamily: "monospace",
        fontSize: "0.78rem",
        lineHeight: 1.6,
        padding: "14px 16px",
        borderRadius: "6px",
        overflowX: "auto",
        margin: "10px 0",
        whiteSpace: "pre",
      }}
    >
      {children}
    </pre>
  );
}

function SectionDivider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid var(--foreground)",
        margin: "40px 0 32px",
      }}
    />
  );
}

type EndpointProps = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  summary: string;
  description?: string;
  queryParams?: {
    name: string;
    type: string;
    required?: boolean;
    description: string;
  }[];
  pathParams?: { name: string; type: string; description: string }[];
  requestBody?: {
    name: string;
    type: string;
    required?: boolean;
    description: string;
  }[];
  responseExample?: string;
  notes?: string[];
};

function Endpoint({
  method,
  path,
  summary,
  description,
  queryParams,
  pathParams,
  requestBody,
  responseExample,
  notes,
}: EndpointProps) {
  return (
    <div
      style={{
        border: "1px solid var(--foreground)",
        borderRadius: "8px",
        padding: "18px 20px",
        marginBottom: "20px",
      }}
    >
      {/* Method + path */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "8px",
        }}
      >
        <MethodBadge method={method} />
        <code
          style={{
            fontFamily: "monospace",
            fontSize: "0.9rem",
            fontWeight: 600,
          }}
        >
          {path}
        </code>
      </div>

      {/* Summary */}
      <p style={{ fontWeight: 600, marginBottom: description ? "6px" : "0" }}>
        {summary}
      </p>
      {description && (
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--text-subtle)",
            marginBottom: "10px",
          }}
        >
          {description}
        </p>
      )}

      {/* Path params */}
      {pathParams && pathParams.length > 0 && (
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--text-subtle)",
              marginBottom: "6px",
            }}
          >
            PATH PARAMETERS
          </div>
          <ParamTable
            rows={pathParams.map((p) => ({ ...p, required: true }))}
          />
        </div>
      )}

      {/* Query params */}
      {queryParams && queryParams.length > 0 && (
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--text-subtle)",
              marginBottom: "6px",
            }}
          >
            QUERY PARAMETERS
          </div>
          <ParamTable rows={queryParams} />
        </div>
      )}

      {/* Request body */}
      {requestBody && requestBody.length > 0 && (
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--text-subtle)",
              marginBottom: "6px",
            }}
          >
            REQUEST BODY —{" "}
            <span style={{ fontFamily: "monospace", fontWeight: 400 }}>
              application/json
            </span>
          </div>
          <ParamTable rows={requestBody} />
        </div>
      )}

      {/* Response example */}
      {responseExample && (
        <div style={{ marginTop: "14px" }}>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--text-subtle)",
              marginBottom: "6px",
            }}
          >
            EXAMPLE RESPONSE
          </div>
          <Pre>{responseExample}</Pre>
        </div>
      )}

      {/* Notes */}
      {notes && notes.length > 0 && (
        <ul
          style={{
            marginTop: "12px",
            paddingLeft: "18px",
            fontSize: "0.85rem",
            color: "var(--text-subtle)",
          }}
        >
          {notes.map((n, i) => (
            <li key={i} style={{ marginBottom: "4px" }}>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type ParamRow = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
};

function ParamTable({ rows }: { rows: ParamRow[] }) {
  return (
    <table
      style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}
    >
      <thead>
        <tr style={{ borderBottom: "1px solid var(--foreground)" }}>
          <th
            style={{
              textAlign: "left",
              padding: "5px 8px 5px 0",
              fontWeight: 600,
              width: "28%",
            }}
          >
            Field
          </th>
          <th
            style={{
              textAlign: "left",
              padding: "5px 8px",
              fontWeight: 600,
              width: "18%",
            }}
          >
            Type
          </th>
          <th
            style={{
              textAlign: "left",
              padding: "5px 8px",
              fontWeight: 600,
              width: "14%",
            }}
          >
            Required
          </th>
          <th style={{ textAlign: "left", padding: "5px 0", fontWeight: 600 }}>
            Description
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--foreground)" }}>
            <td style={{ padding: "6px 8px 6px 0", verticalAlign: "top" }}>
              <Code>{r.name}</Code>
            </td>
            <td
              style={{
                padding: "6px 8px",
                verticalAlign: "top",
                color: "var(--green)",
                fontFamily: "monospace",
                fontSize: "0.82rem",
              }}
            >
              {r.type}
            </td>
            <td
              style={{
                padding: "6px 8px",
                verticalAlign: "top",
                color: r.required ? "var(--red)" : "var(--text-subtle)",
              }}
            >
              {r.required ? "yes" : "no"}
            </td>
            <td
              style={{
                padding: "6px 0",
                verticalAlign: "top",
                color: "var(--text-subtle)",
              }}
            >
              {r.description}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApiDocs() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="scene1">
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            padding: "48px 24px 80px",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "40px" }}>
            <div
              style={{
                fontSize: "0.75rem",
                letterSpacing: "0.12em",
                fontWeight: 700,
                color: "var(--text-subtle)",
                marginBottom: "8px",
              }}
            >
              NOPAL — DEVELOPER DOCS
            </div>
            <h1
              className="purple-light-text"
              style={{
                fontSize: "2.2rem",
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: "16px",
              }}
            >
              Calendar API
            </h1>
            <p
              style={{
                fontSize: "1.05rem",
                color: "var(--text-subtle)",
                maxWidth: "560px",
                lineHeight: 1.6,
              }}
            >
              REST API for managing calendar collections and calendars.
              Collections group calendars under a named context — a project, a
              human, or a freestanding label like "Birthdays." Individual
              calendars inside a collection can be internal or backed by Google
              Calendar.
            </p>
            <div
              style={{
                marginTop: "16px",
                fontSize: "0.85rem",
                color: "var(--text-subtle)",
              }}
            >
              Viewing as{" "}
              <strong style={{ color: "var(--purple-light)" }}>
                {user.name}
              </strong>{" "}
              ({user.email})
            </div>
          </div>

          {/* TOC */}
          <div
            style={{
              background: "var(--yellow-light)",
              borderRadius: "8px",
              padding: "18px 22px",
              marginBottom: "44px",
              fontSize: "0.9rem",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "10px" }}>
              Contents
            </div>
            <ol style={{ paddingLeft: "18px", lineHeight: 2 }}>
              <li>
                <a href="#access" className="link">
                  Access & Authentication
                </a>
              </li>
              <li>
                <a href="#base-url" className="link">
                  Base URL & Format
                </a>
              </li>
              <li>
                <a href="#data-model" className="link">
                  Data Model
                </a>
              </li>
              <li>
                <a href="#collections" className="link">
                  Collections resource
                </a>
              </li>
              <li>
                <a href="#calendars" className="link">
                  Calendars resource
                </a>
              </li>
              <li>
                <a href="#errors" className="link">
                  Error responses
                </a>
              </li>
            </ol>
          </div>

          {/* ── Access ── */}
          <h2
            id="access"
            className="green-text"
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            Access &amp; Authentication
          </h2>
          <p style={{ lineHeight: 1.7, marginBottom: "12px" }}>
            All calendar endpoints require an active Nopal session.
            Authentication is handled via a <strong>session cookie</strong> set
            during the{" "}
            <a href="/login" className="link">
              TOTP login flow
            </a>
            . There is no API key or token — callers must be logged-in Nopal
            humans.
          </p>
          <p style={{ lineHeight: 1.7, marginBottom: "12px" }}>
            Any request without a valid session receives:
          </p>
          <Pre>{`HTTP 401 Unauthorized
{ "error": "Not authenticated" }`}</Pre>

          <div
            style={{
              background: "rgba(127,91,139,0.07)",
              borderLeft: "3px solid var(--purple-light)",
              borderRadius: "0 6px 6px 0",
              padding: "12px 16px",
              margin: "16px 0 24px",
              fontSize: "0.9rem",
              lineHeight: 1.6,
            }}
          >
            <strong>Role requirements.</strong> Currently any authenticated
            human (role <Code>Human</Code>, <Code>Admin</Code>, or{" "}
            <Code>Super</Code>) may read and write all calendar data.
            Role-scoped access may be introduced in a future version.
          </div>

          <p style={{ lineHeight: 1.7, marginBottom: "4px" }}>
            When making requests from a browser context (e.g. a React Router
            action or fetch call inside the app) the session cookie is forwarded
            automatically. For server-to-server calls, forward the{" "}
            <Code>Cookie</Code> header from the originating request.
          </p>

          <SectionDivider />

          {/* ── Base URL ── */}
          <h2
            id="base-url"
            className="green-text"
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            Base URL &amp; Format
          </h2>
          <Pre>{`https://<your-domain>    # production
http://localhost:5173    # local dev`}</Pre>
          <p style={{ lineHeight: 1.7, marginBottom: "8px" }}>
            All endpoints are prefixed with <Code>/api/calendar</Code>. Every
            request and response body uses <Code>application/json</Code>.
          </p>
          <p style={{ lineHeight: 1.7 }}>
            IDs returned from the API (the <Code>_id</Code> field) are SurrealDB
            record IDs — opaque strings that should be treated as stable, unique
            identifiers. Pass them back in path parameters exactly as received.
          </p>

          <SectionDivider />

          {/* ── Data Model ── */}
          <h2
            id="data-model"
            className="green-text"
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            Data Model
          </h2>

          <p style={{ lineHeight: 1.7, marginBottom: "20px" }}>
            The two core objects are <strong>CalendarCollection</strong> and{" "}
            <strong>Calendar</strong>. A collection is always the parent; a
            calendar always belongs to exactly one collection.
          </p>

          <div style={{ fontWeight: 700, marginBottom: "8px" }}>
            CalendarCollection
          </div>
          <Pre>{`{
  "_id":        string,               // SurrealDB record ID
  "name":       string,               // display name, e.g. "Birthdays"
  "type":       "human" | "project" | "named",
  "refId":      string | undefined,   // humanId or projectId when typed
  "createdAt":  string,               // ISO 8601
  "updatedAt":  string,
  "createdBy":  string                // humanId of creator
}`}</Pre>

          <div style={{ fontWeight: 700, margin: "20px 0 8px" }}>Calendar</div>
          <Pre>{`{
  "_id":               string,
  "collectionId":      string,              // parent collection _id
  "name":              string,
  "description":       string | undefined,
  "type":              "internal" | "google",
  "color":             string | undefined,  // hex, e.g. "#5da06d"
  "googleCalendarId":  string | undefined,  // for Google Calendar link
  "timezone":          string,              // IANA tz, default "UTC"
  "isActive":          boolean,
  "createdAt":         string,
  "updatedAt":         string,
  "createdBy":         string
}`}</Pre>

          <SectionDivider />

          {/* ── Collections Resource ── */}
          <h2
            id="collections"
            className="green-text"
            style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "6px" }}
          >
            Collections resource
          </h2>
          <p
            style={{
              color: "var(--text-subtle)",
              fontSize: "0.9rem",
              marginBottom: "24px",
            }}
          >
            Base path: <Code>/api/calendar/collections</Code>
          </p>

          <Endpoint
            method="GET"
            path="/api/calendar/collections"
            summary="List all collections"
            description="Returns the full set of calendar collections. Use query parameters to narrow by type or linked record."
            queryParams={[
              {
                name: "type",
                type: '"human" | "project" | "named"',
                required: false,
                description:
                  "Filter by collection type. Must be used alone or together with refId.",
              },
              {
                name: "refId",
                type: "string",
                required: false,
                description:
                  "Filter by the associated human or project ID. Only meaningful when type is also provided.",
              },
            ]}
            responseExample={`// Without filters — returns paginated collection wrapper
{
  "data": [ ...CalendarCollection ],
  "metadata": { "nextStart": null }
}

// With ?type=project&refId=abc123 — returns plain array
{ "data": [ ...CalendarCollection ] }`}
          />

          <Endpoint
            method="POST"
            path="/api/calendar/collections"
            summary="Create a collection"
            description='Creates a new calendar collection. For a human or project calendar, set type accordingly and supply the matching refId. For a standalone group (e.g. "Birthdays") use type "named".'
            requestBody={[
              {
                name: "name",
                type: "string",
                required: true,
                description: "Human-readable name for the collection.",
              },
              {
                name: "type",
                type: '"human" | "project" | "named"',
                required: true,
                description: "How this collection is associated.",
              },
              {
                name: "refId",
                type: "string",
                required: false,
                description:
                  'The humanId or projectId. Required when type is "human" or "project".',
              },
            ]}
            responseExample={`HTTP 201 Created
{
  "_id": "l3kv2yq8fxm0",
  "name": "Birthdays",
  "type": "named",
  "refId": undefined,
  "createdAt": "2025-01-15T18:00:00.000Z",
  "updatedAt": "2025-01-15T18:00:00.000Z",
  "createdBy": "h9xmq3z1"
}`}
          />

          <Endpoint
            method="GET"
            path="/api/calendar/collections/:id"
            summary="Get a single collection"
            pathParams={[
              {
                name: "id",
                type: "string",
                description: "The collection's _id.",
              },
            ]}
            responseExample={`{
  "_id": "l3kv2yq8fxm0",
  "name": "Sunny Home Project",
  "type": "project",
  "refId": "p8rtz6w2",
  ...
}`}
            notes={["Returns 404 if no collection exists with the given id."]}
          />

          <Endpoint
            method="PUT"
            path="/api/calendar/collections/:id"
            summary="Update a collection"
            description="Partially updates a collection. Only the fields you include are changed."
            pathParams={[
              {
                name: "id",
                type: "string",
                description: "The collection's _id.",
              },
            ]}
            requestBody={[
              {
                name: "name",
                type: "string",
                required: false,
                description: "New display name.",
              },
              {
                name: "type",
                type: '"human" | "project" | "named"',
                required: false,
                description: "New association type.",
              },
              {
                name: "refId",
                type: "string",
                required: false,
                description: "New linked record ID.",
              },
            ]}
            responseExample={`HTTP 200 OK
{ ...updated CalendarCollection }`}
            notes={[
              "Returns 404 if no collection exists with the given id.",
              "updatedAt is automatically set to the current time.",
            ]}
          />

          <Endpoint
            method="DELETE"
            path="/api/calendar/collections/:id"
            summary="Delete a collection"
            description="Permanently removes a collection record. Does not cascade-delete the calendars inside it — remove those first if desired."
            pathParams={[
              {
                name: "id",
                type: "string",
                description: "The collection's _id.",
              },
            ]}
            responseExample={`HTTP 200 OK
{ "success": true }`}
          />

          <Endpoint
            method="GET"
            path="/api/calendar/collections/:collectionId/calendars"
            summary="List calendars in a collection"
            description="Returns all calendars that belong to the given collection, ordered by name ascending."
            pathParams={[
              {
                name: "collectionId",
                type: "string",
                description: "The parent collection's _id.",
              },
            ]}
            responseExample={`{
  "data": [
    {
      "_id": "c4bnx9p2",
      "collectionId": "l3kv2yq8fxm0",
      "name": "Site Visits",
      "type": "internal",
      "timezone": "America/Phoenix",
      "isActive": true,
      ...
    }
  ]
}`}
          />

          <Endpoint
            method="POST"
            path="/api/calendar/collections/:collectionId/calendars"
            summary="Add a calendar to a collection"
            pathParams={[
              {
                name: "collectionId",
                type: "string",
                description: "The parent collection's _id.",
              },
            ]}
            requestBody={[
              {
                name: "name",
                type: "string",
                required: true,
                description: "Display name.",
              },
              {
                name: "type",
                type: '"internal" | "google"',
                required: true,
                description:
                  'Use "google" when linking to an external Google Calendar.',
              },
              {
                name: "description",
                type: "string",
                required: false,
                description: "Optional description.",
              },
              {
                name: "color",
                type: "string",
                required: false,
                description: 'Hex color string, e.g. "#5da06d".',
              },
              {
                name: "googleCalendarId",
                type: "string",
                required: false,
                description:
                  'The Google Calendar ID (e.g. "user@gmail.com"). Required when type is "google".',
              },
              {
                name: "timezone",
                type: "string",
                required: false,
                description: 'IANA timezone string. Defaults to "UTC".',
              },
              {
                name: "isActive",
                type: "boolean",
                required: false,
                description: "Defaults to true.",
              },
            ]}
            responseExample={`HTTP 201 Created
{
  "_id": "c4bnx9p2",
  "collectionId": "l3kv2yq8fxm0",
  "name": "Site Visits",
  "type": "internal",
  "color": "#5da06d",
  "timezone": "America/Phoenix",
  "isActive": true,
  "createdAt": "2025-01-15T18:05:00.000Z",
  "updatedAt": "2025-01-15T18:05:00.000Z",
  "createdBy": "h9xmq3z1"
}`}
          />

          <SectionDivider />

          {/* ── Calendars Resource ── */}
          <h2
            id="calendars"
            className="green-text"
            style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "6px" }}
          >
            Calendars resource
          </h2>
          <p
            style={{
              color: "var(--text-subtle)",
              fontSize: "0.9rem",
              marginBottom: "24px",
            }}
          >
            Base path: <Code>/api/calendar/calendars</Code> — for direct access
            by calendar ID.
          </p>

          <Endpoint
            method="GET"
            path="/api/calendar/calendars/:id"
            summary="Get a single calendar"
            pathParams={[
              {
                name: "id",
                type: "string",
                description: "The calendar's _id.",
              },
            ]}
            responseExample={`{
  "_id": "c4bnx9p2",
  "collectionId": "l3kv2yq8fxm0",
  "name": "Site Visits",
  "type": "internal",
  "timezone": "America/Phoenix",
  "isActive": true,
  ...
}`}
            notes={["Returns 404 if no calendar exists with the given id."]}
          />

          <Endpoint
            method="PUT"
            path="/api/calendar/calendars/:id"
            summary="Update a calendar"
            description="Partially updates a calendar. collectionId cannot be changed after creation — move the calendar by deleting and re-creating it."
            pathParams={[
              {
                name: "id",
                type: "string",
                description: "The calendar's _id.",
              },
            ]}
            requestBody={[
              {
                name: "name",
                type: "string",
                required: false,
                description: "New display name.",
              },
              {
                name: "description",
                type: "string",
                required: false,
                description: "New description.",
              },
              {
                name: "type",
                type: '"internal" | "google"',
                required: false,
                description: "New calendar type.",
              },
              {
                name: "color",
                type: "string",
                required: false,
                description: "New hex color.",
              },
              {
                name: "googleCalendarId",
                type: "string",
                required: false,
                description: "New Google Calendar ID.",
              },
              {
                name: "timezone",
                type: "string",
                required: false,
                description: "New IANA timezone.",
              },
              {
                name: "isActive",
                type: "boolean",
                required: false,
                description: "Toggle active state.",
              },
            ]}
            responseExample={`HTTP 200 OK
{ ...updated Calendar }`}
            notes={[
              "Returns 404 if no calendar exists with the given id.",
              "Only fields present in the request body are updated — omitting a field leaves it unchanged.",
              "updatedAt is automatically set to the current time.",
            ]}
          />

          <Endpoint
            method="DELETE"
            path="/api/calendar/calendars/:id"
            summary="Delete a calendar"
            description="Permanently removes a calendar."
            pathParams={[
              {
                name: "id",
                type: "string",
                description: "The calendar's _id.",
              },
            ]}
            responseExample={`HTTP 200 OK
{ "success": true }`}
          />

          <SectionDivider />

          {/* ── Errors ── */}
          <h2
            id="errors"
            className="green-text"
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "16px",
            }}
          >
            Error responses
          </h2>
          <p style={{ lineHeight: 1.7, marginBottom: "16px" }}>
            All errors follow a consistent shape:
          </p>
          <Pre>{`{ "error": "<human-readable message>" }`}</Pre>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.88rem",
              marginTop: "20px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid var(--foreground)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 12px 6px 0",
                    width: "90px",
                  }}
                >
                  Status
                </th>
                <th style={{ textAlign: "left", padding: "6px 12px 6px 0" }}>
                  Meaning
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "400",
                  "Bad request — missing or invalid field in the request body or query.",
                ],
                ["401", "Not authenticated — no valid session cookie present."],
                ["404", "Not found — the requested resource does not exist."],
                [
                  "405",
                  "Method not allowed — the HTTP method is not supported by this endpoint.",
                ],
                [
                  "500",
                  "Internal server error — something went wrong on the server side.",
                ],
              ].map(([status, meaning]) => (
                <tr
                  key={status}
                  style={{ borderBottom: "1px solid var(--foreground)" }}
                >
                  <td
                    style={{
                      padding: "8px 12px 8px 0",
                      fontFamily: "monospace",
                      fontWeight: 700,
                      color: "var(--red)",
                      verticalAlign: "top",
                    }}
                  >
                    {status}
                  </td>
                  <td
                    style={{
                      padding: "8px 0",
                      color: "var(--text-subtle)",
                      verticalAlign: "top",
                    }}
                  >
                    {meaning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer note */}
          <div
            style={{
              marginTop: "56px",
              paddingTop: "24px",
              borderTop: "1px solid var(--foreground)",
              fontSize: "0.82rem",
              color: "var(--text-subtle)",
            }}
          >
            Google Calendar integration (type: <Code>"google"</Code>) is
            reserved for a future release. The <Code>googleCalendarId</Code>{" "}
            field is accepted and stored now so collection setup can happen in
            advance.
          </div>
        </div>
      </div>
    </Layout>
  );
}
