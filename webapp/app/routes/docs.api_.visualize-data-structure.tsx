import { redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useState, useRef } from "react";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { getUser } from "../modules/auth/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");
  return { user };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldDef = {
  name: string;
  type: string;
  optional?: boolean;
  description?: string;
  refId?: string; // links to another graph node
};

type NodeKind = "entity" | "enum" | "value" | "base";

type GraphNode = {
  id: string;
  label: string;
  kind: NodeKind;
  description: string;
  color: string;
  fields: FieldDef[];
  endpoints?: string[];
  table?: string;
};

type GraphEdge = {
  from: string;
  to: string;
  dashed?: boolean;
};

// ─── Canvas + Node Dimensions ─────────────────────────────────────────────────

const NW = 200; // node width
const NH = 80; // node height
const CANVAS_W = 2200;
const CANVAS_H = 1600;

// ─── Graph Data ───────────────────────────────────────────────────────────────

const NODES: GraphNode[] = [
  // ── Base type ────────────────────────────────────────────────────────────
  {
    id: "Data",
    label: "Data",
    kind: "base",
    description: "Base record type. All DB entities extend this.",
    color: "#888888",
    table: "—",
    fields: [
      {
        name: "id",
        type: "{ tb: string; id: string }",
        description: "SurrealDB record ID",
      },
      {
        name: "_id",
        type: "string",
        description: "Shorthand string ID used in API responses",
      },
    ],
  },

  // ── Humans ───────────────────────────────────────────────────────────────
  {
    id: "Human",
    label: "Human",
    kind: "entity",
    description: "A system user — architect, client, or team member.",
    color: "#4a90d9",
    table: "humans",
    endpoints: [
      "GET /api/humans",
      "POST /api/humans",
      "GET /api/humans/:id",
      "PUT /api/humans/:id",
      "DELETE /api/humans/:id",
    ],
    fields: [
      { name: "email", type: "string" },
      { name: "name", type: "string" },
      { name: "role", type: "Role", refId: "Role" },
    ],
  },
  {
    id: "Role",
    label: "Role",
    kind: "enum",
    description: "Permission level for a Human.",
    color: "#5da06d",
    fields: [
      { name: "Super", type: "literal" },
      { name: "Admin", type: "literal" },
      { name: "Human", type: "literal" },
      { name: "MaybeHuman", type: "literal" },
    ],
  },

  // ── Daily Log ─────────────────────────────────────────────────────────────
  {
    id: "DailyLog",
    label: "DailyLog",
    kind: "entity",
    description: "A human's personal daily log entry (one per day).",
    color: "#9b59b6",
    table: "daily_logs",
    endpoints: ["GET /api/daily-log", "POST /api/daily-log"],
    fields: [
      {
        name: "humanId",
        type: "string",
        refId: "Human",
        description: "Author's _id",
      },
      { name: "date", type: "string", description: "YYYY-MM-DD" },
      { name: "content", type: "string", description: "Markdown body" },
      { name: "createdAt", type: "string" },
      { name: "updatedAt", type: "string" },
    ],
  },

  // ── Project Messages ──────────────────────────────────────────────────────
  {
    id: "ProjectMessage",
    label: "ProjectMessage",
    kind: "entity",
    description: "A message thread entry on a project.",
    color: "#c0608a",
    table: "project_messages",
    endpoints: [
      "GET /api/project-messages",
      "POST /api/project-messages",
      "PUT /api/project-messages/:id",
      "DELETE /api/project-messages/:id",
    ],
    fields: [
      {
        name: "projectId",
        type: "string",
        refId: "Project",
        description: "Parent project's _id",
      },
      {
        name: "humanId",
        type: "string",
        refId: "Human",
        description: "Author's _id",
      },
      {
        name: "content",
        type: "string",
        description: "Markdown message body",
      },
      {
        name: "isInternal",
        type: "boolean",
        description: "true = team-only note",
      },
      { name: "createdAt", type: "string" },
      { name: "updatedAt", type: "string" },
    ],
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  {
    id: "Project",
    label: "Project",
    kind: "entity",
    description: "A build or guide engagement.",
    color: "#e07b3f",
    table: "projects",
    endpoints: [
      "GET /api/projects",
      "POST /api/projects",
      "GET /api/projects/:id",
      "PUT /api/projects/:id",
      "DELETE /api/projects/:id",
    ],
    fields: [
      { name: "name", type: "string" },
      {
        name: "northStar",
        type: "string",
        description: "Guiding mission statement",
      },
      { name: "type", type: "ProjectType", refId: "ProjectType" },
      { name: "address", type: "string" },
      { name: "phases", type: "Phase[]", refId: "Phase" },
      { name: "humans", type: "ProjectHuman[]", refId: "ProjectHuman" },
      { name: "costRange", type: "CostRange", refId: "CostRange" },
      { name: "nopalPhase", type: "NopalPhase", refId: "NopalPhase" },
      { name: "ideaOverview", type: "string", optional: true },
      { name: "createdAt", type: "string" },
      { name: "updatedAt", type: "string" },
      { name: "createdBy", type: "string" },
      { name: "updatedBy", type: "string" },
    ],
  },
  {
    id: "Phase",
    label: "Phase",
    kind: "value",
    description: "A project timeline phase.",
    color: "#b07d1a",
    fields: [
      { name: "startDate", type: "string", description: "ISO 8601" },
      { name: "endDate", type: "string", description: "ISO 8601" },
      { name: "status", type: "string" },
    ],
  },
  {
    id: "ProjectType",
    label: "ProjectType",
    kind: "enum",
    description: "Type of project engagement.",
    color: "#5da06d",
    fields: [
      { name: "Guide", type: "literal" },
      { name: '"Design+Build"', type: "literal" },
    ],
  },
  {
    id: "CostRange",
    label: "CostRange",
    kind: "value",
    description: "[minCost, maxCost] tuple in dollars.",
    color: "#b07d1a",
    fields: [
      { name: "[0]", type: "number", description: "Min cost" },
      { name: "[1]", type: "number", description: "Max cost" },
    ],
  },
  {
    id: "NopalPhase",
    label: "NopalPhase",
    kind: "enum",
    description: "Nopal lifecycle stage for a project.",
    color: "#5da06d",
    fields: [
      { name: "seed", type: "literal" },
      { name: "sprout", type: "literal" },
      { name: "seedling", type: "literal" },
      { name: "flower", type: "literal" },
      { name: "renewing", type: "literal" },
    ],
  },
  {
    id: "ProjectHuman",
    label: "ProjectHuman",
    kind: "value",
    description: "Associates a Human with a Project.",
    color: "#b07d1a",
    fields: [
      { name: "humanId", type: "string", refId: "Human" },
      { name: "role", type: "ProjectRole", refId: "ProjectRole" },
    ],
  },
  {
    id: "ProjectRole",
    label: "ProjectRole",
    kind: "enum",
    description: "Role of a human within a project.",
    color: "#5da06d",
    fields: [
      { name: "Client", type: "literal" },
      { name: "Guide", type: "literal" },
      { name: "Friend", type: "literal" },
    ],
  },

  // ── Building System ───────────────────────────────────────────────────────
  {
    id: "BsCategory",
    label: "BsCategory",
    kind: "entity",
    description: "A top-level building system category.",
    color: "#4a90d9",
    table: "bs_categories",
    endpoints: [
      "GET /api/building-system/categories",
      "POST /api/building-system/categories",
      "GET /api/building-system/categories/:id",
      "PUT /api/building-system/categories/:id",
      "DELETE /api/building-system/categories/:id",
    ],
    fields: [
      { name: "name", type: "string" },
      { name: "slug", type: "string" },
      { name: "createdAt", type: "string" },
      { name: "updatedAt", type: "string" },
    ],
  },
  {
    id: "BuildingSystem",
    label: "BuildingSystem",
    kind: "entity",
    description: "A specific building technique or product.",
    color: "#e07b3f",
    table: "building_systems",
    endpoints: [
      "GET /api/building-system/systems",
      "POST /api/building-system/systems",
      "GET /api/building-system/systems/:id",
      "PUT /api/building-system/systems/:id",
      "DELETE /api/building-system/systems/:id",
    ],
    fields: [
      { name: "name", type: "string" },
      { name: "slug", type: "string" },
      { name: "blocks", type: "Block[]", refId: "MarkdownBlock" },
      { name: "categoryId", type: "string", refId: "BsCategory" },
      { name: "createdAt", type: "string" },
      { name: "updatedAt", type: "string" },
    ],
  },
  {
    id: "MarkdownBlock",
    label: "MarkdownBlock",
    kind: "value",
    description: "A markdown content block.",
    color: "#b07d1a",
    fields: [
      { name: "type", type: '"markdown"' },
      { name: "md", type: "string", description: "Markdown content" },
    ],
  },

  // ── Calendar ──────────────────────────────────────────────────────────────
  {
    id: "CalendarCollection",
    label: "CalendarCollection",
    kind: "entity",
    description: "A named group of calendars linked to a human or project.",
    color: "#4a90d9",
    table: "calendar_collections",
    endpoints: [
      "GET /api/calendar/collections",
      "POST /api/calendar/collections",
      "GET /api/calendar/collections/:id",
      "PUT /api/calendar/collections/:id",
      "DELETE /api/calendar/collections/:id",
    ],
    fields: [
      { name: "name", type: "string" },
      {
        name: "type",
        type: "CalendarCollectionType",
        refId: "CalendarCollectionType",
      },
      {
        name: "refId",
        type: "string",
        optional: true,
        description: "humanId or projectId",
      },
      { name: "createdAt", type: "string" },
      { name: "updatedAt", type: "string" },
      { name: "createdBy", type: "string" },
    ],
  },
  {
    id: "CalendarCollectionType",
    label: "CalCollType",
    kind: "enum",
    description: "How a calendar collection is associated.",
    color: "#5da06d",
    fields: [
      { name: "human", type: "literal" },
      { name: "project", type: "literal" },
      { name: "named", type: "literal" },
    ],
  },
  {
    id: "Calendar",
    label: "Calendar",
    kind: "entity",
    description: "A calendar within a collection.",
    color: "#e07b3f",
    table: "calendars",
    endpoints: [
      "GET /api/calendar/collections/:id/calendars",
      "POST /api/calendar/collections/:id/calendars",
      "GET /api/calendar/calendars/:id",
      "PUT /api/calendar/calendars/:id",
      "DELETE /api/calendar/calendars/:id",
    ],
    fields: [
      { name: "collectionId", type: "string", refId: "CalendarCollection" },
      { name: "name", type: "string" },
      { name: "description", type: "string", optional: true },
      { name: "type", type: "CalendarType", refId: "CalendarType" },
      { name: "color", type: "string", optional: true },
      { name: "googleCalendarId", type: "string", optional: true },
      { name: "timezone", type: "string" },
      { name: "isActive", type: "boolean" },
      { name: "createdAt", type: "string" },
      { name: "updatedAt", type: "string" },
      { name: "createdBy", type: "string" },
    ],
  },
  {
    id: "CalendarType",
    label: "CalendarType",
    kind: "enum",
    description: "Calendar backend type.",
    color: "#5da06d",
    fields: [
      { name: "internal", type: "literal" },
      { name: "google", type: "literal" },
    ],
  },
];

const EDGES: GraphEdge[] = [
  // Human domain
  { from: "Human", to: "Role" },
  { from: "DailyLog", to: "Human" },

  // Project messages
  { from: "ProjectMessage", to: "Human" },
  { from: "ProjectMessage", to: "Project" },

  // Project structure
  { from: "Project", to: "Phase" },
  { from: "Project", to: "ProjectType" },
  { from: "Project", to: "NopalPhase" },
  { from: "Project", to: "CostRange" },
  { from: "Project", to: "ProjectHuman" },
  { from: "ProjectHuman", to: "Human" },
  { from: "ProjectHuman", to: "ProjectRole" },

  // Building system
  { from: "BuildingSystem", to: "BsCategory" },
  { from: "BuildingSystem", to: "MarkdownBlock" },

  // Calendar
  { from: "Calendar", to: "CalendarCollection" },
  { from: "CalendarCollection", to: "CalendarCollectionType" },
  { from: "Calendar", to: "CalendarType" },

  // Optional references (dashed)
  { from: "CalendarCollection", to: "Human", dashed: true },
  { from: "CalendarCollection", to: "Project", dashed: true },
];

// ─── Layout ───────────────────────────────────────────────────────────────────

/**
 * Positions domain clusters on the canvas. Each cluster has an `anchor` (the
 * top-left reference point for that domain group) and a list of nodes with
 * [dx, dy] pixel offsets from that anchor.
 *
 * Benefits over a strict grid:
 *   • Moving an entire domain = change one anchor value.
 *   • Nodes within a domain fan out at angles, so edges are visible diagonals
 *     rather than straight lines obscured by node alignment.
 *   • Fine-tune any single node by adjusting its [dx, dy] pair.
 */
function layoutGroups(
  groups: ReadonlyArray<{
    label: string;
    anchor: { x: number; y: number };
    nodes: ReadonlyArray<readonly [id: string, dx: number, dy: number]>;
  }>,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  for (const { anchor, nodes } of groups) {
    for (const [id, dx, dy] of nodes) {
      positions[id] = { x: anchor.x + dx, y: anchor.y + dy };
    }
  }
  return positions;
}

const INITIAL_POSITIONS = layoutGroups([
  // ── Base ─────────────────────────────────────────────────────────────────
  {
    label: "base",
    anchor: { x: 620, y: 30 },
    nodes: [["Data", 0, 0]],
  },

  // ── Human domain (left) ───────────────────────────────────────────────────
  // Anchor = Human entity. DailyLog and ProjectMessage hang below; Role fans
  // right so the Human→Role edge is a visible diagonal.
  {
    label: "humans",
    anchor: { x: 80, y: 170 },
    nodes: [
      ["Human", 0, 0],
      ["Role", -20, 160],
      ["DailyLog", 220, 250],
      ["ProjectMessage", 0, 340],
    ],
  },

  // ── Project domain (center) ───────────────────────────────────────────────
  // Anchor = Project entity. Phase goes upper-right; value/enum types fan
  // right and below; ProjectHuman sits between Human and Project so both
  // outgoing edges (→ Human, → Project) are clear diagonals.
  {
    label: "projects",
    anchor: { x: 560, y: 160 },
    nodes: [
      ["Project", 0, 0],
      ["Phase", 320, -100],
      ["ProjectType", 260, 130],
      ["CostRange", 500, 100],
      ["NopalPhase", 80, 260],
      ["ProjectHuman", -210, 150],
      ["ProjectRole", -270, 350],
    ],
  },

  // ── Building System (right) ───────────────────────────────────────────────
  {
    label: "building-system",
    anchor: { x: 1280, y: 110 },
    nodes: [
      ["BsCategory", 0, 0],
      ["BuildingSystem", 0, 210],
      ["MarkdownBlock", 220, 330],
    ],
  },

  // ── Calendar (lower center) ───────────────────────────────────────────────
  // Sits below the project cluster. CalendarCollection references both Human
  // and Project via dashed edges, creating long visible cross-domain diagonals.
  {
    label: "calendar",
    anchor: { x: 520, y: 590 },
    nodes: [
      ["CalendarCollection", 0, 0],
      ["Calendar", 280, 0],
      ["CalendarCollectionType", -180, 130],
      ["CalendarType", 460, 120],
    ],
  },
]);

// ─── Kind Config ──────────────────────────────────────────────────────────────

const KIND_CONFIG: Record<
  NodeKind,
  { badge: string; badgeBg: string; badgeText: string }
> = {
  entity: {
    badge: "ENTITY",
    badgeBg: "rgba(74,144,217,0.12)",
    badgeText: "#1a66b3",
  },
  enum: {
    badge: "ENUM",
    badgeBg: "rgba(93,160,109,0.16)",
    badgeText: "#2a6e40",
  },
  value: {
    badge: "VALUE",
    badgeBg: "rgba(176,125,26,0.14)",
    badgeText: "#7a5010",
  },
  base: {
    badge: "BASE",
    badgeBg: "rgba(136,136,136,0.14)",
    badgeText: "#555",
  },
};

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: "rgba(93,160,109,0.14)", text: "#2a6e40" },
  POST: { bg: "rgba(130,86,163,0.14)", text: "#6a30a3" },
  PUT: { bg: "rgba(176,125,26,0.14)", text: "#7a5010" },
  DELETE: { bg: "rgba(166,59,49,0.14)", text: "var(--red)" },
};

// ─── SVG Edge Helpers ─────────────────────────────────────────────────────────

function rectEdgeDist(nx: number, ny: number, hw: number, hh: number): number {
  const tx = nx !== 0 ? hw / Math.abs(nx) : Infinity;
  const ty = ny !== 0 ? hh / Math.abs(ny) : Infinity;
  return Math.min(tx, ty);
}

function edgePath(fx: number, fy: number, tx: number, ty: number): string {
  const hw = NW / 2;
  const hh = NH / 2;

  const x1 = fx + hw;
  const y1 = fy + hh;
  const x2 = tx + hw;
  const y2 = ty + hh;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return "";

  const nx = dx / len;
  const ny = dy / len;

  const gap = 4;
  const sd = rectEdgeDist(nx, ny, hw, hh) + gap;
  const ed = rectEdgeDist(nx, ny, hw, hh) + gap;

  if (len < sd + ed + 4) return "";

  const sx = x1 + nx * sd;
  const sy = y1 + ny * sd;
  const ex = x2 - nx * ed;
  const ey = y2 - ny * ed;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const f = (n: number) => n.toFixed(1);

  if (absDy > absDx * 0.6) {
    const my = ((sy + ey) / 2).toFixed(1);
    return `M ${f(sx)} ${f(sy)} C ${f(sx)} ${my}, ${f(ex)} ${my}, ${f(ex)} ${f(ey)}`;
  } else {
    const mx = ((sx + ex) / 2).toFixed(1);
    return `M ${f(sx)} ${f(sy)} C ${mx} ${f(sy)}, ${mx} ${f(ey)}, ${f(ex)} ${f(ey)}`;
  }
}

// ─── NodeCard ─────────────────────────────────────────────────────────────────

function NodeCard({
  node,
  x,
  y,
  isSelected,
  dimmed,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
}: {
  node: GraphNode;
  x: number;
  y: number;
  isSelected: boolean;
  dimmed: boolean;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onClick: () => void;
}) {
  const kc = KIND_CONFIG[node.kind];

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: NW,
        height: NH,
        background: "var(--white)",
        border: `1.5px solid ${isSelected ? node.color : "var(--foreground)"}`,
        borderLeft: `5px solid ${node.color}`,
        borderRadius: 8,
        cursor: isDragging ? "grabbing" : "grab",
        padding: "10px 12px 10px 10px",
        boxSizing: "border-box",
        boxShadow: isDragging
          ? `0 8px 28px ${node.color}44`
          : isSelected
            ? `0 4px 18px ${node.color}55`
            : "0 1px 4px rgba(63,43,70,0.08)",
        transition: isDragging
          ? "box-shadow 0.1s"
          : "box-shadow 0.15s, border-color 0.15s, opacity 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        overflow: "hidden",
        opacity: dimmed ? 0.35 : 1,
        userSelect: "none",
        touchAction: "none",
        zIndex: isDragging ? 50 : isSelected ? 10 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span
          style={{
            fontSize: 8,
            fontFamily: "monospace",
            fontWeight: 700,
            letterSpacing: "0.07em",
            background: kc.badgeBg,
            color: kc.badgeText,
            padding: "1px 4px",
            borderRadius: 3,
            flexShrink: 0,
            lineHeight: "14px",
          }}
        >
          {kc.badge}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--purple)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: "16px",
          }}
        >
          {node.label}
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 10,
          lineHeight: 1.4,
          color: "var(--text-subtle)",
          overflow: "hidden",
          maxHeight: "2.8em",
        }}
      >
        {node.description}
      </p>
      {node.table && node.table !== "—" && (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            color: "var(--text-subtle)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node.table}
        </span>
      )}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  node,
  allNodes,
  onClose,
  onNavigate,
}: {
  node: GraphNode;
  allNodes: GraphNode[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const kc = KIND_CONFIG[node.kind];
  const nodeById = (id: string) => allNodes.find((n) => n.id === id);

  return (
    <div
      style={{
        width: 310,
        minWidth: 310,
        background: "var(--white)",
        borderLeft: "1px solid var(--foreground)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: node.color + "12",
          borderBottom: `3px solid ${node.color}`,
          padding: "16px 16px 14px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  background: kc.badgeBg,
                  color: kc.badgeText,
                  padding: "2px 6px",
                  borderRadius: 3,
                }}
              >
                {kc.badge}
              </span>
              {node.table && (
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    color: "var(--text-subtle)",
                    background: "var(--midground)",
                    padding: "2px 6px",
                    borderRadius: 3,
                  }}
                >
                  {node.table}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--purple)",
                marginBottom: 5,
                lineHeight: 1.2,
              }}
            >
              {node.label}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--text-subtle)",
                lineHeight: 1.5,
              }}
            >
              {node.description}
            </p>
            {node.kind !== "base" && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 10,
                  color: "var(--text-subtle)",
                }}
              >
                extends{" "}
                <button
                  onClick={() => onNavigate("Data")}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 10,
                    background: "var(--midground)",
                    color: "var(--purple)",
                    border: "1px solid var(--foreground)",
                    borderRadius: 3,
                    padding: "0 5px",
                    cursor: "pointer",
                    lineHeight: "18px",
                  }}
                >
                  Data
                </button>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-subtle)",
              fontSize: 20,
              lineHeight: 1,
              padding: "0 0 0 8px",
              flexShrink: 0,
            }}
            title="Close"
            aria-label="Close panel"
          >
            ×
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "14px 16px 24px",
        }}
      >
        {/* Fields */}
        {node.fields.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--text-subtle)",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Fields
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {node.fields.map((f) => {
                const refNode = f.refId ? nodeById(f.refId) : undefined;
                return (
                  <div
                    key={f.name}
                    style={{
                      background: "var(--farground)",
                      borderRadius: 6,
                      padding: "7px 10px",
                      border: "1px solid var(--midground)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--purple)",
                        }}
                      >
                        {f.name}
                        {f.optional && (
                          <span
                            style={{
                              color: "var(--text-subtle)",
                              fontWeight: 400,
                              opacity: 0.6,
                            }}
                          >
                            ?
                          </span>
                        )}
                      </span>
                      {refNode ? (
                        <button
                          onClick={() => onNavigate(refNode.id)}
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            background: refNode.color + "18",
                            color: refNode.color,
                            border: `1px solid ${refNode.color}40`,
                            borderRadius: 3,
                            padding: "0 5px",
                            cursor: "pointer",
                            lineHeight: "18px",
                          }}
                          title={`View ${f.type}`}
                        >
                          {f.type}
                        </button>
                      ) : (
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            color: "var(--text-subtle)",
                            background: "var(--midground)",
                            padding: "0 5px",
                            borderRadius: 3,
                            lineHeight: "18px",
                          }}
                        >
                          {f.type}
                        </span>
                      )}
                    </div>
                    {f.description && (
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 10,
                          color: "var(--text-subtle)",
                          lineHeight: 1.4,
                        }}
                      >
                        {f.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* API Endpoints */}
        {node.endpoints && node.endpoints.length > 0 && (
          <section>
            <div
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--text-subtle)",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              API Endpoints
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {node.endpoints.map((ep) => {
                const parts = ep.split(" ");
                const method = parts[0];
                const path = parts.slice(1).join(" ");
                const mc = METHOD_COLORS[method] ?? METHOD_COLORS.GET;
                return (
                  <div
                    key={ep}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "monospace",
                      fontSize: 10,
                    }}
                  >
                    <span
                      style={{
                        background: mc.bg,
                        color: mc.text,
                        fontWeight: 700,
                        padding: "2px 5px",
                        borderRadius: 3,
                        flexShrink: 0,
                        fontSize: 9,
                        letterSpacing: "0.05em",
                        lineHeight: "16px",
                      }}
                    >
                      {method}
                    </span>
                    <span
                      style={{
                        color: "var(--purple)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {path}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const kinds: { kind: NodeKind; color: string; label: string }[] = [
    { kind: "entity", color: "#4a90d9", label: "DB entity" },
    { kind: "enum", color: "#5da06d", label: "Enum" },
    { kind: "value", color: "#b07d1a", label: "Value object" },
    { kind: "base", color: "#888", label: "Base type" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        padding: "10px 18px",
        borderBottom: "1px solid var(--foreground)",
        flexWrap: "wrap",
        alignItems: "center",
        background: "var(--farground)",
        fontSize: 11,
      }}
    >
      <span
        style={{
          fontWeight: 700,
          color: "var(--text-subtle)",
          fontSize: 10,
          marginRight: 2,
        }}
      >
        Legend:
      </span>
      {kinds.map(({ kind, color, label }) => {
        const kc = KIND_CONFIG[kind];
        return (
          <div
            key={kind}
            style={{ display: "flex", alignItems: "center", gap: 5 }}
          >
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 16,
                background: color,
                borderRadius: 1.5,
              }}
            />
            <span
              style={{
                fontSize: 8,
                fontFamily: "monospace",
                fontWeight: 700,
                background: kc.badgeBg,
                color: kc.badgeText,
                padding: "1px 4px",
                borderRadius: 3,
                letterSpacing: "0.06em",
              }}
            >
              {kc.badge}
            </span>
            <span style={{ color: "var(--text-subtle)" }}>{label}</span>
          </div>
        );
      })}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginLeft: 8,
          paddingLeft: 16,
          borderLeft: "1px solid var(--foreground)",
        }}
      >
        <svg width="26" height="10" style={{ flexShrink: 0 }}>
          <line x1="0" y1="5" x2="22" y2="5" stroke="#bbb" strokeWidth="1.5" />
          <polygon points="20,2.5 26,5 20,7.5" fill="#bbb" />
        </svg>
        <span style={{ color: "var(--text-subtle)" }}>field ref</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="26" height="10" style={{ flexShrink: 0 }}>
          <line
            x1="0"
            y1="5"
            x2="22"
            y2="5"
            stroke="#ccc"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <polygon points="20,2.5 26,5 20,7.5" fill="#ccc" />
        </svg>
        <span style={{ color: "var(--text-subtle)" }}>optional ref</span>
      </div>
      <div
        style={{
          marginLeft: "auto",
          fontSize: 10,
          color: "var(--text-subtle)",
          fontStyle: "italic",
        }}
      >
        Click a node to inspect · scroll to pan · middle-click drag to pan
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DataStructureVisualizer() {
  const { user } = useLoaderData<typeof loader>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // ── Positions state (computed once from NODE_GRID before first render) ────
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => ({ ...INITIAL_POSITIONS }));

  // ── Drag tracking ────────────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const dragRef = useRef<{
    nodeId: string;
    pointerId: number;
    startPX: number;
    startPY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  // Prevents the click-after-pointerup from toggling selection after a drag
  const didDragRef = useRef(false);

  const selectedNode = NODES.find((n) => n.id === selectedId) ?? null;

  const connectedIds: Set<string> = selectedId
    ? new Set(
        EDGES.flatMap((e) => {
          if (e.from === selectedId) return [e.to];
          if (e.to === selectedId) return [e.from];
          return [];
        }),
      )
    : new Set();

  const nodeById = (id: string) => NODES.find((n) => n.id === id);

  // ── Drag handlers ────────────────────────────────────────────────────────
  function handlePointerDown(
    nodeId: string,
    e: React.PointerEvent<HTMLDivElement>,
  ) {
    e.stopPropagation();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    const pos = positions[nodeId];
    dragRef.current = {
      nodeId,
      pointerId: e.pointerId,
      startPX: e.clientX,
      startPY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    setDraggingId(nodeId);
  }

  function handlePointerMove(
    nodeId: string,
    e: React.PointerEvent<HTMLDivElement>,
  ) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || drag.nodeId !== nodeId)
      return;

    const dx = e.clientX - drag.startPX;
    const dy = e.clientY - drag.startPY;

    if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      drag.moved = true;
    }

    if (drag.moved) {
      setPositions((prev) => ({
        ...prev,
        [nodeId]: { x: drag.origX + dx, y: drag.origY + dy },
      }));
    }
  }

  function handlePointerUp(
    nodeId: string,
    e: React.PointerEvent<HTMLDivElement>,
  ) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || drag.nodeId !== nodeId)
      return;

    if (drag.moved) {
      didDragRef.current = true;
    }
    dragRef.current = null;
    setDraggingId(null);
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  // ── Middle-mouse pan handlers ─────────────────────────────────────────────
  function handleCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 1) return;
    e.preventDefault(); // suppress autoscroll cursor
    const el = canvasRef.current;
    if (!el) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    panRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    setIsPanning(true);
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;
    const el = canvasRef.current;
    if (!el) return;
    el.scrollLeft = pan.scrollLeft - (e.clientX - pan.startX);
    el.scrollTop = pan.scrollTop - (e.clientY - pan.startY);
  }

  function handleCanvasPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;
    panRef.current = null;
    setIsPanning(false);
  }

  function handleNodeClick(id: string) {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function handleCanvasClick() {
    setSelectedId(null);
  }

  return (
    <Layout>
      <div className="scene1" style={{ minHeight: "100vh" }}>
        {/* Page header */}
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "40px 24px 20px",
          }}
        >
          <div
            className="font-mono font-bold subtle-text"
            style={{
              fontSize: 10,
              marginBottom: 6,
              letterSpacing: "0.08em",
            }}
          >
            NOPAL — DEVELOPER DOCS
          </div>
          <h1
            className="purple-light-text"
            style={{
              fontSize: "1.9rem",
              fontWeight: 700,
              marginBottom: 8,
              lineHeight: 1.2,
            }}
          >
            Data Structure Visualizer
          </h1>
          <div className="subtle-text">
            Viewing as <strong className="purple-text">{user.name}</strong>
          </div>
        </div>

        {/* Graph wrapper */}
        <div
          style={{
            margin: "0 20px 60px",
            border: "1px solid var(--foreground)",
            borderRadius: 12,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 2px 12px rgba(63,43,70,0.06)",
          }}
        >
          <Legend />

          <div style={{ display: "flex", flex: 1, minHeight: 620 }}>
            {/* Scrollable canvas */}
            <div
              ref={canvasRef}
              style={{
                flex: 1,
                overflow: "auto",
                background: "var(--farground)",
                backgroundImage:
                  "radial-gradient(circle, var(--midground) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                cursor: isPanning ? "grabbing" : "auto",
              }}
              onClick={handleCanvasClick}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
            >
              <div
                style={{
                  position: "relative",
                  width: CANVAS_W,
                  height: CANVAS_H,
                }}
              >
                {/* SVG edge layer */}
                <svg
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: CANVAS_W,
                    height: CANVAS_H,
                    pointerEvents: "none",
                  }}
                >
                  <defs>
                    <marker
                      id="arrow-solid"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M 0 1 L 7 4 L 0 7 Z" fill="#bbb" />
                    </marker>
                    <marker
                      id="arrow-dashed"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M 0 1 L 7 4 L 0 7 Z" fill="#ccc" />
                    </marker>
                    <marker
                      id="arrow-active"
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                    >
                      <path d="M 0 1 L 7 4 L 0 7 Z" fill="#4a90d9" />
                    </marker>
                  </defs>

                  {EDGES.map((edge, i) => {
                    const fromPos = positions[edge.from];
                    const toPos = positions[edge.to];
                    if (!fromPos || !toPos) return null;

                    const d = edgePath(fromPos.x, fromPos.y, toPos.x, toPos.y);
                    if (!d) return null;

                    const isActive =
                      selectedId !== null &&
                      (edge.from === selectedId || edge.to === selectedId);
                    const isFaded = selectedId !== null && !isActive;

                    return (
                      <path
                        key={i}
                        d={d}
                        fill="none"
                        stroke={
                          isActive ? "#4a90d9" : edge.dashed ? "#ccc" : "#bbb"
                        }
                        strokeWidth={isActive ? 2 : 1.5}
                        strokeDasharray={edge.dashed ? "5 4" : undefined}
                        markerEnd={`url(#${
                          isActive
                            ? "arrow-active"
                            : edge.dashed
                              ? "arrow-dashed"
                              : "arrow-solid"
                        })`}
                        opacity={isFaded ? 0.2 : 1}
                        style={{ transition: "opacity 0.15s" }}
                      />
                    );
                  })}
                </svg>

                {/* Node cards */}
                {NODES.map((node) => {
                  const pos = positions[node.id];
                  const isSelected = node.id === selectedId;
                  const isDragging = node.id === draggingId;
                  const dimmed =
                    selectedId !== null &&
                    !isSelected &&
                    !isDragging &&
                    !connectedIds.has(node.id);

                  return (
                    <NodeCard
                      key={node.id}
                      node={node}
                      x={pos?.x ?? 0}
                      y={pos?.y ?? 0}
                      isSelected={isSelected}
                      dimmed={dimmed}
                      isDragging={isDragging}
                      onPointerDown={(e) => handlePointerDown(node.id, e)}
                      onPointerMove={(e) => handlePointerMove(node.id, e)}
                      onPointerUp={(e) => handlePointerUp(node.id, e)}
                      onClick={() => handleNodeClick(node.id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            {selectedNode && (
              <DetailPanel
                node={selectedNode}
                allNodes={NODES}
                onClose={() => setSelectedId(null)}
                onNavigate={(id) => setSelectedId(id)}
              />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
