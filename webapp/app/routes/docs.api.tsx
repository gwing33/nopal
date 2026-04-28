import { redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Layout } from "../components/Layout";
import { getUser } from "../modules/auth/auth.server";
import { Footer } from "../components/Footer";
import type { EndpointProps, ParamRow } from "../data/docs.types";
import {
  humansGet,
  humansPost,
  humansGetById,
  humansPut,
  humansDelete,
} from "../data/docs.humans";
import {
  projectsGet,
  projectsPost,
  projectsGetById,
  projectsPut,
  projectsDelete,
} from "../data/docs.projects";
import {
  collectionsGet,
  collectionsPost,
  collectionsGetById,
  collectionsPut,
  collectionsDelete,
  collectionsCalendarsGet,
  collectionsCalendarsPost,
  calendarsGetById,
  calendarsPut,
  calendarsDelete,
} from "../data/docs.calendars";
import { uploadPost } from "../data/docs.upload";
import {
  projectMessagesGet,
  projectMessagesPost,
  projectMessagesPut,
  projectMessagesDelete,
} from "../data/docs.projectMessages";
import {
  bsCategoriesGet,
  bsCategoriesPost,
  bsCategoriesGetById,
  bsCategoriesPut,
  bsCategoriesDelete,
  bsSystemsGet,
  bsSystemsPost,
  bsSystemsGetById,
  bsSystemsPut,
  bsSystemsDelete,
} from "../data/docs.buildingSystem";
import { dailyLogGet, dailyLogPost } from "../data/docs.dailyLog";

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
      className="text-xs font-mono px-1.5 py-0.5 rounded"
      style={{
        background: "var(--midground)",
        color: "var(--purple)",
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
        margin: "8px 0",
        whiteSpace: "pre",
        border: "1px solid var(--foreground)",
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

function Endpoint({
  method,
  path,
  summary,
  description,
  queryParams,
  pathParams,
  requestBody,
  contentType,
  responseExample,
  notes,
}: EndpointProps) {
  return (
    <div
      className="good-box"
      style={{ padding: "18px 20px", marginBottom: "20px" }}
    >
      {/* Method + path */}
      <div className="flex items-center gap-2.5 mb-2">
        <MethodBadge method={method} />
        <code className="font-mono font-bold" style={{ fontSize: "0.9rem" }}>
          {path}
        </code>
      </div>

      {/* Summary */}
      <p
        className="font-bold"
        style={{ marginBottom: description ? "6px" : "0" }}
      >
        {summary}
      </p>
      {description && (
        <p className="text-sm subtle-text" style={{ marginBottom: "10px" }}>
          {description}
        </p>
      )}

      {/* Path params */}
      {pathParams && pathParams.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-mono font-bold subtle-text mb-1.5">
            PATH PARAMETERS
          </div>
          <ParamTable
            rows={pathParams.map((p) => ({ ...p, required: true }))}
          />
        </div>
      )}

      {/* Query params */}
      {queryParams && queryParams.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-mono font-bold subtle-text mb-1.5">
            QUERY PARAMETERS
          </div>
          <ParamTable rows={queryParams} />
        </div>
      )}

      {/* Request body */}
      {requestBody && requestBody.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-mono font-bold subtle-text mb-1.5">
            REQUEST BODY —{" "}
            <span className="font-normal font-mono">
              {contentType ?? "application/json"}
            </span>
          </div>
          <ParamTable rows={requestBody} />
        </div>
      )}

      {/* Response example */}
      {responseExample && (
        <div className="mt-3">
          <div className="text-xs font-mono font-bold subtle-text mb-1.5">
            EXAMPLE RESPONSE
          </div>
          <Pre>{responseExample}</Pre>
        </div>
      )}

      {/* Notes */}
      {notes && notes.length > 0 && (
        <ul
          className="text-sm subtle-text mt-3"
          style={{ paddingLeft: "18px" }}
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

function ParamTable({ rows }: { rows: ParamRow[] }) {
  return (
    <table
      style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}
    >
      <thead>
        <tr style={{ borderBottom: "1px solid var(--foreground)" }}>
          <th
            className="text-left font-bold"
            style={{ padding: "5px 8px 5px 0", width: "28%" }}
          >
            Field
          </th>
          <th
            className="text-left font-bold"
            style={{ padding: "5px 8px", width: "18%" }}
          >
            Type
          </th>
          <th
            className="text-left font-bold"
            style={{ padding: "5px 8px", width: "14%" }}
          >
            Required
          </th>
          <th className="text-left font-bold" style={{ padding: "5px 0" }}>
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
              className="green-text font-mono"
              style={{
                padding: "6px 8px",
                verticalAlign: "top",
                fontSize: "0.82rem",
              }}
            >
              {r.type}
            </td>
            <td
              className={r.required ? "red-text" : "subtle-text"}
              style={{ padding: "6px 8px", verticalAlign: "top" }}
            >
              {r.required ? "yes" : "no"}
            </td>
            <td
              className="subtle-text"
              style={{ padding: "6px 0", verticalAlign: "top" }}
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
          <div className="mb-10">
            <div className="text-xs font-mono font-bold subtle-text mb-2">
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
              REST API
            </h1>
            <div className="text-sm subtle-text mt-4">
              Viewing as{" "}
              <strong className="purple-light-text">{user.name}</strong> (
              {user.email})
            </div>
          </div>

          {/* TOC */}
          <div
            className="rounded-lg"
            style={{
              background: "var(--yellow-light)",
              padding: "18px 22px",
              marginBottom: "44px",
              fontSize: "0.9rem",
            }}
          >
            <div className="font-bold mb-2" style={{ color: "var(--purple)" }}>
              Contents
            </div>
            <ol
              style={{
                paddingLeft: "18px",
                listStyleType: "number",
                lineHeight: 2,
                color: "var(--green)",
              }}
            >
              <li>
                <a href="#access">Access & Authentication</a>
              </li>
              <li>
                <a href="#base-url">Base URL & Format</a>
              </li>
              <li>
                <a href="#data-model">Data Model</a>
              </li>
              <li>
                <a href="#humans">Humans resource</a>
              </li>
              <li>
                <a href="#projects">Projects resource</a>
              </li>
              <li>
                <a href="#collections">Calendar collections resource</a>
              </li>
              <li>
                <a href="#calendars">Calendars resource</a>
              </li>
              <li>
                <a href="#upload">File Upload resource</a>
              </li>
              <li>
                <a href="#project-messages">Project Messages resource</a>
              </li>
              <li>
                <a href="#building-system">Building System resource</a>
              </li>
              <li>
                <a href="#daily-log">Daily Log resource</a>
              </li>
              <li>
                <a href="#errors">Error responses</a>
              </li>
            </ol>
          </div>

          {/* ── Access ── */}
          <h2 id="access" className="green-text font-bold text-2xl mb-4">
            Access &amp; Authentication
          </h2>
          <p className="mb-3" style={{ lineHeight: 1.7 }}>
            All calendar endpoints require an active Nopal session.
            Authentication is handled via a <strong>session cookie</strong> set
            during the{" "}
            <a href="/login" className="link">
              TOTP login flow
            </a>
            . There is no API key or token — callers must be logged-in Nopal
            humans.
          </p>
          <p className="mb-3" style={{ lineHeight: 1.7 }}>
            Any request without a valid session receives:
          </p>
          <Pre>{`HTTP 401 Unauthorized
{ "error": "Not authenticated" }`}</Pre>

          <div
            className="text-sm"
            style={{
              background: "rgba(127,91,139,0.07)",
              borderLeft: "3px solid var(--purple-light)",
              borderRadius: "0 6px 6px 0",
              padding: "12px 16px",
              margin: "16px 0 24px",
              lineHeight: 1.6,
            }}
          >
            <strong>Role requirements.</strong> Currently any authenticated
            human (role <Code>Human</Code>, <Code>Admin</Code>, or{" "}
            <Code>Super</Code>) may read and write all calendar data.
            Role-scoped access may be introduced in a future version.
          </div>

          <p className="mb-1" style={{ lineHeight: 1.7 }}>
            When making requests from a browser context (e.g. a React Router
            action or fetch call inside the app) the session cookie is forwarded
            automatically. For server-to-server calls, forward the{" "}
            <Code>Cookie</Code> header from the originating request.
          </p>

          <SectionDivider />

          {/* ── Base URL ── */}
          <h2 id="base-url" className="green-text font-bold text-2xl mb-4">
            Base URL &amp; Format
          </h2>
          <Pre>{`https://<your-domain>    # production
http://localhost:5173    # local dev`}</Pre>
          <p className="mb-2" style={{ lineHeight: 1.7 }}>
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
          <h2 id="data-model" className="green-text font-bold text-2xl mb-4">
            Data Model
          </h2>

          <p className="mb-5" style={{ lineHeight: 1.7 }}>
            The core objects across all resources — <strong>Human</strong>,{" "}
            <strong>Project</strong>, <strong>CalendarCollection</strong>,{" "}
            <strong>Calendar</strong>, <strong>ProjectMessage</strong>,{" "}
            <strong>BsCategory</strong>, <strong>BuildingSystem</strong>, and{" "}
            <strong>DailyLog</strong>.
          </p>

          <div className="font-bold mb-2">Human</div>
          <Pre>{`{
  "_id":    string,                                    // SurrealDB record ID
  "email":  string,
  "name":   string,
  "role":   "Super" | "Admin" | "Human" | "MaybeHuman"
}`}</Pre>

          <div className="font-bold mt-5 mb-2">Project</div>
          <Pre>{`{
  "_id":          string,
  "name":         string,
  "northStar":    string,
  "type":         "Guide" | "Design+Build",
  "address":      string,
  "nopalPhase":   "seed" | "sprout" | "seedling" | "flower" | "renewing",
  "ideaOverview": string | undefined,
  "phases":       Array<{ startDate: string; endDate: string; status: string }>,
  "humans":       Array<{ humanId: string; role: "Client" | "Guide" | "Friend" }>,
  "costRange":    [number, number],                    // [minCost, maxCost]
  "createdAt":    string,                              // ISO 8601
  "updatedAt":    string,
  "createdBy":    string,                              // humanId
  "updatedBy":    string
}`}</Pre>

          <div className="font-bold mt-5 mb-2">CalendarCollection</div>
          <Pre>{`{
  "_id":        string,               // SurrealDB record ID
  "name":       string,               // display name, e.g. "Birthdays"
  "type":       "human" | "project" | "named",
  "refId":      string | undefined,   // humanId or projectId when typed
  "createdAt":  string,               // ISO 8601
  "updatedAt":  string,
  "createdBy":  string                // humanId of creator
}`}</Pre>

          <div className="font-bold mt-5 mb-2">Calendar</div>
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

          <div className="font-bold mt-5 mb-2">ProjectMessage</div>
          <Pre>{`{
  "_id":        string,
  "projectId":  string,
  "humanId":    string,
  "content":    string,    // markdown
  "isInternal": boolean,
  "createdAt":  string,
  "updatedAt":  string
}`}</Pre>

          <div className="font-bold mt-5 mb-2">BsCategory</div>
          <Pre>{`{
  "_id":       string,
  "name":      string,
  "slug":      string,
  "createdAt": string,
  "updatedAt": string
}`}</Pre>

          <div className="font-bold mt-5 mb-2">BuildingSystem</div>
          <Pre>{`{
  "_id":        string,
  "name":       string,
  "slug":       string,
  "blocks":     Array<{ type: "markdown"; md: string }>,
  "categoryId": string,
  "createdAt":  string,
  "updatedAt":  string
}`}</Pre>

          <div className="font-bold mt-5 mb-2">DailyLog</div>
          <Pre>{`{
  "_id":       string,
  "humanId":   string,
  "date":      string,    // YYYY-MM-DD local date
  "content":   string,    // markdown
  "createdAt": string,
  "updatedAt": string
}`}</Pre>

          <SectionDivider />

          {/* ── Humans Resource ── */}
          <h2 id="humans" className="green-text font-bold text-2xl mb-2">
            Humans resource
          </h2>
          <p className="text-sm subtle-text mb-6">
            Base path: <Code>/api/humans</Code>
          </p>

          <Endpoint {...humansGet} />

          <Endpoint {...humansPost} />

          <Endpoint {...humansGetById} />

          <Endpoint {...humansPut} />

          <Endpoint {...humansDelete} />

          <SectionDivider />

          {/* ── Projects Resource ── */}
          <h2 id="projects" className="green-text font-bold text-2xl mb-2">
            Projects resource
          </h2>
          <p className="text-sm subtle-text mb-6">
            Base path: <Code>/api/projects</Code>
          </p>

          <Endpoint {...projectsGet} />

          <Endpoint {...projectsPost} />

          <Endpoint {...projectsGetById} />

          <Endpoint {...projectsPut} />

          <Endpoint {...projectsDelete} />

          <SectionDivider />

          {/* ── Collections Resource ── */}
          <h2 id="collections" className="green-text font-bold text-2xl mb-2">
            Calendar collections resource
          </h2>
          <p className="text-sm subtle-text mb-6">
            Base path: <Code>/api/calendar/collections</Code>
          </p>

          <Endpoint {...collectionsGet} />

          <Endpoint {...collectionsPost} />

          <Endpoint {...collectionsGetById} />

          <Endpoint {...collectionsPut} />

          <Endpoint {...collectionsDelete} />

          <Endpoint {...collectionsCalendarsGet} />

          <Endpoint {...collectionsCalendarsPost} />

          <SectionDivider />

          {/* ── Calendars Resource ── */}
          <h2 id="calendars" className="green-text font-bold text-2xl mb-2">
            Calendars resource
          </h2>
          <p className="text-sm subtle-text mb-6">
            Base path: <Code>/api/calendar/calendars</Code> — for direct access
            by calendar ID.
          </p>

          <Endpoint {...calendarsGetById} />

          <Endpoint {...calendarsPut} />

          <Endpoint {...calendarsDelete} />

          <SectionDivider />

          {/* ── File Upload Resource ── */}
          <h2 id="upload" className="green-text font-bold text-2xl mb-2">
            File Upload resource
          </h2>
          <p className="text-sm subtle-text mb-6">
            Base path: <Code>/api/upload</Code>
          </p>

          <Endpoint {...uploadPost} />

          <SectionDivider />

          {/* ── Project Messages Resource ── */}
          <h2
            id="project-messages"
            className="green-text font-bold text-2xl mb-2"
          >
            Project Messages resource
          </h2>
          <p className="text-sm subtle-text mb-6">
            Base path: <Code>/api/project-messages</Code>
          </p>

          <Endpoint {...projectMessagesGet} />

          <Endpoint {...projectMessagesPost} />

          <Endpoint {...projectMessagesPut} />

          <Endpoint {...projectMessagesDelete} />

          <SectionDivider />

          {/* ── Building System Resource ── */}
          <h2
            id="building-system"
            className="green-text font-bold text-2xl mb-2"
          >
            Building System resource
          </h2>
          <p className="mb-3" style={{ lineHeight: 1.7 }}>
            Two sub-resources — <strong>categories</strong> and{" "}
            <strong>systems</strong>. Write operations (POST, PUT, DELETE)
            require <Code>Admin</Code> or <Code>Super</Code> role.
          </p>

          <h3 className="font-bold text-lg mt-6 mb-1 purple-light-text">
            Categories
          </h3>
          <p className="text-sm subtle-text mb-6">
            Base path: <Code>/api/building-system/categories</Code>
          </p>

          <Endpoint {...bsCategoriesGet} />

          <Endpoint {...bsCategoriesPost} />

          <Endpoint {...bsCategoriesGetById} />

          <Endpoint {...bsCategoriesPut} />

          <Endpoint {...bsCategoriesDelete} />

          <h3 className="font-bold text-lg mt-8 mb-1 purple-light-text">
            Systems
          </h3>
          <p className="text-sm subtle-text mb-6">
            Base path: <Code>/api/building-system/systems</Code>
          </p>

          <Endpoint {...bsSystemsGet} />

          <Endpoint {...bsSystemsPost} />

          <Endpoint {...bsSystemsGetById} />

          <Endpoint {...bsSystemsPut} />

          <Endpoint {...bsSystemsDelete} />

          <SectionDivider />

          {/* ── Daily Log Resource ── */}
          <h2 id="daily-log" className="green-text font-bold text-2xl mb-2">
            Daily Log resource
          </h2>
          <p className="text-sm subtle-text mb-6">
            Base path: <Code>/api/daily-log</Code>
          </p>

          <Endpoint {...dailyLogGet} />

          <Endpoint {...dailyLogPost} />

          <SectionDivider />

          {/* ── Errors ── */}
          <h2 id="errors" className="green-text font-bold text-2xl mb-4">
            Error responses
          </h2>
          <p className="mb-4" style={{ lineHeight: 1.7 }}>
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
                  className="text-left"
                  style={{ padding: "6px 12px 6px 0", width: "90px" }}
                >
                  Status
                </th>
                <th className="text-left" style={{ padding: "6px 12px 6px 0" }}>
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
                    className="font-mono font-bold red-text"
                    style={{ padding: "8px 12px 8px 0", verticalAlign: "top" }}
                  >
                    {status}
                  </td>
                  <td
                    className="subtle-text"
                    style={{ padding: "8px 0", verticalAlign: "top" }}
                  >
                    {meaning}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer></Footer>
    </Layout>
  );
}
