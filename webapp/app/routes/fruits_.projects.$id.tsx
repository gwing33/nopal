// app/routes/fruits_.projects.$id.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { redirect, useLoaderData, useFetcher, Link } from "react-router";
import {
  useState,
  useEffect,
  useRef,
  lazy,
  Suspense,
  useCallback,
} from "react";
import { getUser } from "../modules/auth/auth.server";
import {
  getProjectById,
  updateProject,
  type ProjectRole,
  type Project,
  type NopalPhase,
  type ProjectHuman,
} from "../data/projects.server";
import {
  getMessagesByProjectId,
  createMessage,
  updateMessage,
  type ProjectMessage,
} from "../data/project_messages.server";
import { getHumanByEmail } from "../data/humans.server";
import { AppLayout } from "../components/AppLayout";
import { ProgressPlanter } from "../components/ProgressPlanter";
import type { Human } from "../data/humans.server";
import { useMarkdown } from "../hooks/useMarkdown";

const MdxEditorClient = lazy(() => import("../components/MdxEditorClient"));

// ── Loader ─────────────────────────────────────────────────────────────────

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const { id } = params;
  if (!id) return redirect("/fruits");

  const project = await getProjectById(id);
  if (!project) throw new Response("Project not found", { status: 404 });

  const isAdmin = user.role === "Admin" || user.role === "Super";
  const myHuman = project.humans.find((h) => h.humanId === user._id);
  if (!myHuman && !isAdmin)
    throw new Response("Not authorized", { status: 403 });

  const messages = await getMessagesByProjectId(id);

  return {
    user,
    project,
    messages,
    myRole: (myHuman?.role ?? "Guide") as ProjectRole,
  };
}

// ── Action ─────────────────────────────────────────────────────────────────

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const { id } = params;
  if (!id) return Response.json({ error: "No project id" }, { status: 400 });

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "send_message") {
    const content = String(formData.get("content") ?? "").trim();
    const isInternal = formData.get("isInternal") === "true";
    if (!content)
      return Response.json({ error: "Empty message" }, { status: 400 });
    await createMessage({
      projectId: id,
      humanId: user._id,
      content,
      isInternal,
    });
    return Response.json({ ok: true });
  }

  // ── Guide / Admin only intents ──────────────────────────────────────────
  const isAdmin = user.role === "Admin" || user.role === "Super";
  const project = await getProjectById(id);
  if (!project)
    return Response.json({ error: "Project not found" }, { status: 404 });
  const myHuman = project.humans.find((h) => h.humanId === user._id);
  const canEdit = myHuman?.role === "Guide" || isAdmin;
  if (!canEdit)
    return Response.json({ error: "Not authorized" }, { status: 403 });

  if (intent === "update_project_info") {
    const address = String(formData.get("address") ?? "").trim();
    const costMin = Math.max(0, Number(formData.get("costMin") ?? 0) || 0);
    const costMax = Math.max(0, Number(formData.get("costMax") ?? 0) || 0);
    await updateProject(id, {
      address,
      costRange: [costMin, costMax],
      actorId: user._id,
    });
    return Response.json({ ok: true });
  }

  if (intent === "add_team_member") {
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const role = String(formData.get("role") ?? "Client") as ProjectRole;
    if (!email)
      return Response.json({ error: "Email is required." }, { status: 400 });

    const human = await getHumanByEmail(email);
    if (!human)
      return Response.json(
        { error: `No account found for ${email}.` },
        { status: 404 },
      );

    const alreadyOnTeam = project.humans.some((h) => h.humanId === human._id);
    if (alreadyOnTeam)
      return Response.json(
        { error: "That person is already on the team." },
        { status: 400 },
      );

    await updateProject(id, {
      humans: [...project.humans, { humanId: human._id, role }],
      actorId: user._id,
    });
    return Response.json({ ok: true });
  }

  if (intent === "remove_team_member") {
    const humanId = String(formData.get("humanId") ?? "");
    await updateProject(id, {
      humans: project.humans.filter((h) => h.humanId !== humanId),
      actorId: user._id,
    });
    return Response.json({ ok: true });
  }

  if (intent === "update_message") {
    const messageId = String(formData.get("messageId") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    if (!messageId || !content)
      return Response.json({ error: "Missing fields." }, { status: 400 });
    await updateMessage(messageId, { content });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown intent" }, { status: 400 });
}

// ── Utilities ──────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function humanInitials(humanId: string): string {
  return humanId.slice(0, 2).toUpperCase();
}

const PHASE_LABELS: Record<string, string> = {
  seed: "Seed",
  sprout: "Sprout",
  seedling: "Seedling",
  flower: "Flower",
  renewing: "Renewing",
};

const PHASE_COLORS: Record<string, string> = {
  seed: "#b45309",
  sprout: "#3A7A2E",
  seedling: "#4E9A3E",
  flower: "#d97706",
  renewing: "#C62A47",
};

function phaseLabel(phase: string): string {
  return PHASE_LABELS[phase] ?? phase;
}

function phaseColor(phase: string): string {
  return PHASE_COLORS[phase] ?? "var(--purple)";
}

// ── Shared mini-styles ─────────────────────────────────────────────────────

const panelInputStyle: React.CSSProperties = {
  padding: "5px 8px",
  borderRadius: "4px",
  border: "1px solid var(--midground)",
  background: "var(--background)",
  color: "var(--purple)",
  fontSize: "12px",
  fontFamily: "monospace",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const panelLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "monospace",
  color: "var(--text-subtle)",
  display: "flex",
  flexDirection: "column",
  gap: "3px",
};

const sectionHeadStyle: React.CSSProperties = {
  fontSize: "10px",
  fontFamily: "monospace",
  fontWeight: "bold",
  color: "var(--purple)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "8px",
};

// ── ProjectInfoPanel ───────────────────────────────────────────────────────

function ProjectInfoPanel({
  project,
  canEdit,
}: {
  project: Project;
  canEdit: boolean;
}) {
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const [costMin, costMax] = project.costRange ?? [0, 0];

  const [address, setAddress] = useState(project.address ?? "");
  const [min, setMin] = useState(costMin > 0 ? String(costMin) : "");
  const [max, setMax] = useState(costMax > 0 ? String(costMax) : "");

  // Sync with fresh loader data after a successful save
  useEffect(() => {
    setAddress(project.address ?? "");
    const [cmin, cmax] = project.costRange ?? [0, 0];
    setMin(cmin > 0 ? String(cmin) : "");
    setMax(cmax > 0 ? String(cmax) : "");
  }, [project.address, project.costRange]);

  const saving = fetcher.state !== "idle";

  return (
    <div style={{ flex: 1, minWidth: "220px" }}>
      <div style={sectionHeadStyle}>Project Details</div>
      <fetcher.Form
        method="POST"
        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
      >
        <input type="hidden" name="intent" value="update_project_info" />

        <label style={panelLabelStyle}>
          Address
          <input
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!canEdit}
            placeholder="123 Main St, City, State"
            style={panelInputStyle}
          />
        </label>

        <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
          <label style={{ ...panelLabelStyle, flex: 1 }}>
            Budget Min ($)
            <input
              name="costMin"
              type="number"
              min="0"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              disabled={!canEdit}
              placeholder="0"
              style={panelInputStyle}
            />
          </label>
          <span
            style={{
              paddingBottom: "7px",
              color: "var(--text-subtle)",
              fontSize: "12px",
            }}
          >
            –
          </span>
          <label style={{ ...panelLabelStyle, flex: 1 }}>
            Max ($)
            <input
              name="costMax"
              type="number"
              min="0"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              disabled={!canEdit}
              placeholder="0"
              style={panelInputStyle}
            />
          </label>
        </div>

        {fetcher.data?.error && (
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "var(--red)",
              fontFamily: "monospace",
            }}
          >
            {fetcher.data.error}
          </p>
        )}

        {canEdit && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "5px 14px",
                borderRadius: "4px",
                background: "var(--purple)",
                color: "white",
                border: "none",
                cursor: saving ? "wait" : "pointer",
                fontSize: "12px",
                fontFamily: "monospace",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}

// ── TeamMemberRow ──────────────────────────────────────────────────────────

function TeamMemberRow({
  member,
  canEdit,
  currentUserId,
}: {
  member: ProjectHuman;
  canEdit: boolean;
  currentUserId: string;
}) {
  const removeFetcher = useFetcher();
  const isSelf = member.humanId === currentUserId;
  const removing = removeFetcher.state !== "idle";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        padding: "4px 0",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "var(--midground)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "9px",
          fontWeight: "bold",
          color: "var(--purple-light)",
          flexShrink: 0,
        }}
      >
        {humanInitials(member.humanId)}
      </div>

      {/* ID */}
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "var(--text-subtle)",
        }}
      >
        {member.humanId}
      </span>

      {/* Role pill */}
      <span
        style={{
          fontSize: "10px",
          padding: "1px 6px",
          borderRadius: "999px",
          background: "var(--farground)",
          border: "1px solid var(--midground)",
          color: "var(--purple-light)",
          flexShrink: 0,
        }}
      >
        {member.role}
      </span>

      {/* Remove */}
      {canEdit && !isSelf && (
        <removeFetcher.Form method="POST">
          <input type="hidden" name="intent" value="remove_team_member" />
          <input type="hidden" name="humanId" value={member.humanId} />
          <button
            type="submit"
            disabled={removing}
            title="Remove from team"
            style={{
              background: "none",
              border: "none",
              cursor: removing ? "wait" : "pointer",
              color: "var(--text-subtle)",
              fontSize: "14px",
              lineHeight: 1,
              padding: "0 2px",
              opacity: removing ? 0.4 : 0.6,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </removeFetcher.Form>
      )}
    </div>
  );
}

// ── TeamPanel ──────────────────────────────────────────────────────────────

function TeamPanel({
  project,
  canEdit,
  currentUserId,
}: {
  project: Project;
  canEdit: boolean;
  currentUserId: string;
}) {
  const addFetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<ProjectRole>("Client");
  const adding = addFetcher.state !== "idle";

  useEffect(() => {
    if (addFetcher.data?.ok) setAddEmail("");
  }, [addFetcher.data]);

  return (
    <div style={{ flex: 1, minWidth: "220px" }}>
      <div style={sectionHeadStyle}>Team</div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {project.humans.map((h) => (
          <TeamMemberRow
            key={h.humanId}
            member={h}
            canEdit={canEdit}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {canEdit && (
        <>
          <div
            style={{
              borderTop: "1px solid var(--midground)",
              margin: "8px 0",
              opacity: 0.4,
            }}
          />
          <addFetcher.Form
            method="POST"
            style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}
          >
            <input type="hidden" name="intent" value="add_team_member" />
            <label style={{ ...panelLabelStyle, flex: 1 }}>
              Email
              <input
                name="email"
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="someone@email.com"
                style={panelInputStyle}
              />
            </label>
            <label style={{ ...panelLabelStyle, width: "86px" }}>
              Role
              <select
                name="role"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as ProjectRole)}
                style={{
                  ...panelInputStyle,
                  appearance: "none",
                  paddingRight: "4px",
                }}
              >
                <option value="Client">Client</option>
                <option value="Guide">Guide</option>
                <option value="Friend">Friend</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={adding || !addEmail.trim()}
              style={{
                padding: "5px 12px",
                borderRadius: "4px",
                background: "var(--purple)",
                color: "white",
                border: "none",
                cursor: adding || !addEmail.trim() ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontFamily: "monospace",
                flexShrink: 0,
                opacity: adding || !addEmail.trim() ? 0.5 : 1,
                marginBottom: "1px",
              }}
            >
              {adding ? "…" : "Add"}
            </button>
          </addFetcher.Form>
          {addFetcher.data?.error && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "11px",
                color: "var(--red)",
                fontFamily: "monospace",
              }}
            >
              {addFetcher.data.error}
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── ProjectHeader ──────────────────────────────────────────────────────────

function ProjectHeader({
  project,
  myRole,
  user,
}: {
  project: Project;
  myRole: ProjectRole;
  user: Human;
}) {
  const color = phaseColor(project.nopalPhase);
  const isAdmin = user.role === "Admin" || user.role === "Super";
  const canEdit = myRole === "Guide" || isAdmin;
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "var(--farground)",
        borderBottom: "1px solid var(--foreground)",
      }}
    >
      {/* ── Main bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "10px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Progress Planter */}
        <div style={{ flexShrink: 0 }}>
          <ProgressPlanter phase={project.nopalPhase} size={52} />
        </div>

        {/* Project info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <h1
              style={{
                fontSize: "17px",
                fontWeight: "bold",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {project.name}
            </h1>

            {/* Phase badge */}
            <span
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                padding: "2px 8px",
                borderRadius: "999px",
                background: color + "22",
                color,
                border: `1px solid ${color}55`,
                flexShrink: 0,
              }}
            >
              {phaseLabel(project.nopalPhase)}
            </span>

            {/* Role badge */}
            <span
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                padding: "2px 8px",
                borderRadius: "4px",
                background: "var(--farground)",
                border: "1px solid var(--midground)",
                color: "var(--purple-light)",
                flexShrink: 0,
              }}
            >
              {myRole}
            </span>
          </div>

          {project.northStar && (
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "12px",
                color: "var(--text-subtle)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              ✦ {project.northStar}
            </p>
          )}
        </div>

        {/* Details toggle */}
        <button
          onClick={() => setPanelOpen((o) => !o)}
          title={panelOpen ? "Close details" : "View / edit details"}
          style={{
            background: panelOpen ? "var(--purple)" + "18" : "none",
            border: `1px solid ${panelOpen ? "var(--purple)" : "var(--midground)"}`,
            borderRadius: "6px",
            cursor: "pointer",
            color: panelOpen ? "var(--purple)" : "var(--text-subtle)",
            fontSize: "12px",
            fontFamily: "monospace",
            padding: "4px 8px",
            flexShrink: 0,
            transition: "all 150ms",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {canEdit ? "✏ details" : "details"}{" "}
          <span style={{ fontSize: "9px", opacity: 0.7 }}>
            {panelOpen ? "▲" : "▼"}
          </span>
        </button>

        {/* Back link */}
        <Link
          to="/fruits"
          style={{
            fontSize: "12px",
            fontFamily: "monospace",
            color: "var(--purple-light)",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          ← projects
        </Link>
      </div>

      {/* ── Expandable details panel ──────────────────────────────────── */}
      {panelOpen && (
        <div
          style={{
            borderTop: "1px solid var(--midground)",
            background: "var(--background)",
            padding: "16px 20px 20px",
          }}
        >
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              display: "flex",
              gap: "32px",
              flexWrap: "wrap",
            }}
          >
            <ProjectInfoPanel project={project} canEdit={canEdit} />
            <div
              style={{
                width: "1px",
                background: "var(--midground)",
                opacity: 0.4,
                alignSelf: "stretch",
                flexShrink: 0,
              }}
            />
            <TeamPanel
              project={project}
              canEdit={canEdit}
              currentUserId={user._id}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── IdeaOverviewCard ───────────────────────────────────────────────────────

function IdeaOverviewCard({ ideaOverview }: { ideaOverview: string }) {
  const rendered = useMarkdown(ideaOverview);
  if (!ideaOverview.trim()) return null;
  return (
    <div
      style={{
        marginBottom: "24px",
        padding: "16px 20px",
        borderRadius: "8px",
        background: "var(--farground)",
        border: "1px solid var(--midground)",
        borderLeft: "3px solid var(--purple)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontFamily: "monospace",
          fontWeight: "bold",
          color: "var(--purple)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "10px",
        }}
      >
        🌱 Project Overview
      </div>
      <div style={{ fontSize: "14px", lineHeight: "1.6" }}>{rendered}</div>
    </div>
  );
}

// ── PersonalNoteCard ──────────────────────────────────────────────────────

function PersonalNoteCard({
  message,
  canEdit,
}: {
  message: ProjectMessage;
  canEdit: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isClient, setIsClient] = useState(false);
  const [editKey, setEditKey] = useState(0);
  const editFetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const renderedContent = useMarkdown(message.content);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (editFetcher.data?.ok) setIsEditing(false);
  }, [editFetcher.data]);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const json = (await res.json()) as { url?: string; error?: string };
    if (!json.url) throw new Error(json.error ?? "Upload failed");
    return json.url;
  }, []);

  const handleSave = useCallback(() => {
    const trimmed = editContent.trim();
    if (!trimmed || editFetcher.state !== "idle") return;
    editFetcher.submit(
      { intent: "update_message", messageId: message._id, content: trimmed },
      { method: "POST" },
    );
  }, [editContent, message._id, editFetcher]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
    setEditKey((k) => k + 1);
  }, [message.content]);

  return (
    <div
      style={{
        marginBottom: "12px",
        borderRadius: "8px",
        background: "var(--farground)",
        border: "1px solid var(--midground)",
        borderLeft: "3px solid var(--purple-light)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px 0",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontFamily: "monospace",
            fontWeight: "bold",
            color: "var(--purple-light)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          🔒 Personal Note
        </span>
        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setEditContent(message.content);
              setIsEditing(true);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "monospace",
              color: "var(--text-subtle)",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            edit
          </button>
        )}
      </div>

      {/* Content — read or edit */}
      {isEditing ? (
        <>
          <div
            className="mdx-editor-wrapper mdx-editor-chat"
            style={{
              border: "none",
              borderRadius: 0,
              borderTop: "1px solid var(--midground)",
              marginTop: "8px",
            }}
          >
            {isClient ? (
              <Suspense
                fallback={
                  <div
                    style={{
                      padding: "10px 14px",
                      fontSize: "14px",
                      color: "var(--text-subtle)",
                      fontFamily: "monospace",
                      minHeight: "52px",
                    }}
                  >
                    Loading editor…
                  </div>
                }
              >
                <MdxEditorClient
                  key={editKey}
                  markdown={editContent}
                  onChange={setEditContent}
                  uploadFile={uploadFile}
                  trayButtons={
                    <>
                      {editFetcher.data?.error && (
                        <span
                          style={{
                            flex: 1,
                            fontSize: "11px",
                            color: "var(--red)",
                            fontFamily: "monospace",
                          }}
                        >
                          {editFetcher.data.error}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleCancel}
                        style={{
                          padding: "5px 12px",
                          borderRadius: "6px",
                          background: "none",
                          border: "1px solid var(--midground)",
                          color: "var(--text-subtle)",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={
                          !editContent.trim() || editFetcher.state !== "idle"
                        }
                        style={{
                          padding: "5px 16px",
                          borderRadius: "6px",
                          background: "var(--purple)",
                          color: "white",
                          border: "none",
                          cursor:
                            !editContent.trim() || editFetcher.state !== "idle"
                              ? "not-allowed"
                              : "pointer",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          opacity:
                            !editContent.trim() || editFetcher.state !== "idle"
                              ? 0.5
                              : 1,
                          transition: "opacity 150ms",
                        }}
                      >
                        {editFetcher.state !== "idle" ? "…" : "Save"}
                      </button>
                    </>
                  }
                />
              </Suspense>
            ) : null}
          </div>
        </>
      ) : (
        <div
          style={{ padding: "8px 16px", fontSize: "14px", lineHeight: "1.6" }}
        >
          {renderedContent}
        </div>
      )}

      {/* Timestamp — only in read mode */}
      {!isEditing && (
        <span
          style={{
            fontSize: "10px",
            fontFamily: "monospace",
            color: "var(--text-subtle)",
            padding: "0 16px 10px",
            display: "block",
            opacity: 0.65,
          }}
        >
          {formatRelativeTime(message.createdAt)}
        </span>
      )}
    </div>
  );
}

// ── MessageBubble ──────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isMe,
  showInternal,
}: {
  message: ProjectMessage;
  isMe: boolean;
  showInternal: boolean;
}) {
  const renderedContent = useMarkdown(message.content);
  if (message.isInternal && !showInternal) return null;

  // Personal notes render as editable callout cards
  if (message.isInternal) {
    return <PersonalNoteCard message={message} canEdit={isMe} />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMe ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: "8px",
        marginBottom: "12px",
      }}
    >
      {/* Avatar – only for incoming messages */}
      {!isMe && (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--midground)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontFamily: "monospace",
            fontWeight: "bold",
            color: "var(--purple-light)",
            flexShrink: 0,
          }}
        >
          {humanInitials(message.humanId)}
        </div>
      )}

      {/* Bubble + timestamp */}
      <div
        style={{
          maxWidth: "70%",
          display: "flex",
          flexDirection: "column",
          alignItems: isMe ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            borderRadius: isMe ? "12px 0 12px 12px" : "0 12px 12px 12px",
            background: isMe ? "var(--purple)" : "var(--farground)",
            color: isMe ? "white" : "inherit",
            border: isMe ? "none" : "1px solid var(--midground)",
            fontSize: "14px",
            lineHeight: "1.55",
          }}
        >
          <div style={{ margin: 0 }}>{renderedContent}</div>
        </div>
        <span
          style={{
            fontSize: "10px",
            fontFamily: "monospace",
            color: "var(--text-subtle)",
            marginTop: "3px",
            opacity: 0.65,
          }}
        >
          {formatRelativeTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ── SeedPhaseView ──────────────────────────────────────────────────────────

function SeedPhaseView({
  project,
  messages,
  user,
  myRole,
}: {
  project: Project;
  messages: ProjectMessage[];
  user: Human;
  myRole: ProjectRole;
}) {
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInternal, setIsInternal] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [sendKey, setSendKey] = useState(0);

  const isAdmin = user.role === "Admin" || user.role === "Super";
  const canSendInternal = myRole === "Guide" || isAdmin;
  const showInternal = canSendInternal;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear editor after a successful send
  useEffect(() => {
    if (fetcher.data?.ok) {
      setEditorContent("");
      setSendKey((k) => k + 1);
      setIsInternal(false);
    }
  }, [fetcher.data]);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const json = (await res.json()) as { url?: string; error?: string };
    if (!json.url) throw new Error(json.error ?? "Upload failed");
    return json.url;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = editorContent.trim();
    if (!trimmed || fetcher.state !== "idle") return;
    fetcher.submit(
      {
        intent: "send_message",
        content: trimmed,
        isInternal: String(isInternal),
      },
      { method: "POST" },
    );
  }, [editorContent, isInternal, fetcher]);

  return (
    <>
      {/* ── Scrollable messages area ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "16px 16px 8px",
          }}
        >
          {/* Idea overview pinned at top */}
          <IdeaOverviewCard ideaOverview={project.ideaOverview ?? ""} />

          {messages.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 16px",
                color: "var(--text-subtle)",
                fontSize: "13px",
                fontFamily: "monospace",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>🌱</div>
              <div>No messages yet. Start the conversation!</div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isMe={msg.humanId === user._id}
              showInternal={showInternal}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>

        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "10px 16px 14px",
          }}
        >
          {/* Single bordered container — mdx-editor-wrapper provides bg/overflow/radius;
              inline border overrides its default so Personal Note mode can tint it. */}
          <div
            className="mdx-editor-wrapper mdx-editor-chat"
            style={{
              border: `1px solid ${isInternal ? "var(--purple-light)" : "var(--midground)"}`,
            }}
          >
            {isClient ? (
              <Suspense
                fallback={
                  <div
                    style={{
                      padding: "10px 14px",
                      fontSize: "14px",
                      color: "var(--text-subtle)",
                      fontFamily: "monospace",
                      minHeight: "52px",
                    }}
                  >
                    Loading editor…
                  </div>
                }
              >
                <MdxEditorClient
                  key={sendKey}
                  markdown=""
                  onChange={setEditorContent}
                  uploadFile={uploadFile}
                  trayButtons={
                    <>
                      {fetcher.data?.error && (
                        <span
                          style={{
                            flex: 1,
                            fontSize: "11px",
                            color: "var(--red)",
                            fontFamily: "monospace",
                          }}
                        >
                          {fetcher.data.error}
                        </span>
                      )}
                      {canSendInternal && (
                        <button
                          type="button"
                          onClick={() => setIsInternal((o) => !o)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: "6px",
                            background: isInternal
                              ? "var(--purple-light)" + "28"
                              : "none",
                            border: `1px solid ${isInternal ? "var(--purple-light)" : "var(--midground)"}`,
                            color: isInternal
                              ? "var(--purple)"
                              : "var(--text-subtle)",
                            fontSize: "12px",
                            fontFamily: "monospace",
                            cursor: "pointer",
                            flexShrink: 0,
                            transition: "all 150ms",
                          }}
                        >
                          🔒 Personal Note
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={
                          !editorContent.trim() || fetcher.state !== "idle"
                        }
                        style={{
                          padding: "5px 16px",
                          borderRadius: "6px",
                          background: "var(--purple)",
                          color: "white",
                          border: "none",
                          cursor:
                            !editorContent.trim() || fetcher.state !== "idle"
                              ? "not-allowed"
                              : "pointer",
                          fontSize: "13px",
                          fontFamily: "monospace",
                          flexShrink: 0,
                          opacity:
                            !editorContent.trim() || fetcher.state !== "idle"
                              ? 0.5
                              : 1,
                          transition: "opacity 150ms",
                        }}
                      >
                        {fetcher.state !== "idle" ? "…" : "Send →"}
                      </button>
                    </>
                  }
                />
              </Suspense>
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: "14px",
                  color: "var(--text-subtle)",
                  fontFamily: "monospace",
                  minHeight: "52px",
                }}
              >
                Message…
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── ComingSoonView ─────────────────────────────────────────────────────────

function ComingSoonView({ phase }: { phase: NopalPhase }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: "16px",
      }}
    >
      <ProgressPlanter phase={phase} size={120} />
      <p
        style={{
          fontSize: "13px",
          fontFamily: "monospace",
          color: "var(--text-subtle)",
          margin: 0,
        }}
      >
        Coming Soon: {phaseLabel(phase)} Phase
      </p>
    </div>
  );
}

// ── Journey View ────────────────────────────────────────────────────────────

const PHASES: NopalPhase[] = [
  "seed",
  "sprout",
  "seedling",
  "flower",
  "renewing",
];

const PHASE_DESCRIPTIONS: Record<string, string> = {
  seed: "Your project is born. We gather ideas, scope the vision, and plant the first seeds of possibility together.",
  sprout:
    "The plan takes shape. Design concepts emerge and the first green shoots become visible.",
  seedling:
    "Real momentum. Drawings are underway, decisions are being made, and your project is growing fast.",
  flower:
    "The bloom is near. Final details, permits, and preparations — everything is almost ready.",
  renewing:
    "Life in your new space. We ensure everything thrives long after the work is done.",
};

function JourneyPathConnector({ unlocked }: { unlocked: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg
        width="28"
        height="64"
        viewBox="0 0 28 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14 0 C8 16 20 32 14 48 C11 56 14 64 14 64"
          stroke={unlocked ? "#5AAA48" : "var(--border)"}
          strokeWidth="2.5"
          strokeDasharray="7 5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 56 L14 63 L20 56"
          stroke={unlocked ? "#5AAA48" : "var(--border)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function PhaseJourneyCard({
  phase,
  isUnlocked,
  isCurrent,
  onClick,
}: {
  phase: NopalPhase;
  isUnlocked: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const color = phaseColor(phase);
  const label = phaseLabel(phase);

  return (
    <div
      role={isUnlocked ? "button" : undefined}
      tabIndex={isUnlocked ? 0 : undefined}
      onClick={isUnlocked ? onClick : undefined}
      onKeyDown={isUnlocked ? (e) => e.key === "Enter" && onClick() : undefined}
      style={{
        position: "relative",
        borderRadius: "20px",
        border: isCurrent
          ? `2.5px solid ${color}`
          : "1.5px solid var(--border)",
        background: isCurrent ? `${color}10` : "var(--surface)",
        padding: "24px 22px",
        cursor: isUnlocked ? "pointer" : "default",
        filter: isUnlocked ? "none" : "grayscale(0.75) opacity(0.48)",
        boxShadow: isCurrent ? `0 4px 24px ${color}28` : "none",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        maxWidth: "440px",
        margin: "0 auto",
        userSelect: "none",
      }}
      onMouseEnter={(e) => {
        if (!isUnlocked) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = `0 8px 28px ${color}38`;
      }}
      onMouseLeave={(e) => {
        if (!isUnlocked) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = isCurrent ? `0 4px 24px ${color}28` : "none";
      }}
    >
      {/* "You are here" badge */}
      {isCurrent && (
        <div
          style={{
            position: "absolute",
            top: "-13px",
            left: "50%",
            transform: "translateX(-50%)",
            background: color,
            color: "#fff",
            fontSize: "10px",
            fontFamily: "monospace",
            fontWeight: 700,
            padding: "3px 14px",
            borderRadius: "20px",
            letterSpacing: "0.09em",
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          ● You are here
        </div>
      )}

      {/* Lock badge */}
      {!isUnlocked && (
        <div
          style={{
            position: "absolute",
            top: "18px",
            right: "20px",
            fontSize: "17px",
            opacity: 0.65,
            pointerEvents: "none",
          }}
        >
          🔒
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Large illustration */}
        <div style={{ flexShrink: 0 }}>
          <ProgressPlanter phase={phase} size={136} />
        </div>

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "21px",
              fontFamily: "monospace",
              fontWeight: 700,
              color: isUnlocked ? color : "var(--text-subtle)",
              marginBottom: "7px",
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: "12px",
              fontFamily: "monospace",
              color: "var(--text-subtle)",
              lineHeight: "1.65",
              marginBottom: isUnlocked ? "14px" : "0",
            }}
          >
            {PHASE_DESCRIPTIONS[phase]}
          </div>
          {isUnlocked && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: isCurrent ? color : "transparent",
                color: isCurrent ? "#fff" : color,
                border: `1.5px solid ${color}`,
                borderRadius: "10px",
                padding: "5px 14px",
                fontSize: "11px",
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: "0.03em",
              }}
            >
              {isCurrent ? "Enter" : "Review"} →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JourneyView({
  project,
  onSelect,
}: {
  project: Project;
  onSelect: (phase: NopalPhase) => void;
}) {
  const currentIndex = PHASES.indexOf(project.nopalPhase);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "0 16px 64px",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          padding: "32px 16px 30px",
        }}
      >
        <div style={{ fontSize: "38px", marginBottom: "10px" }}>🌵</div>
        <h2
          style={{
            fontSize: "20px",
            fontFamily: "monospace",
            fontWeight: 700,
            color: "var(--text)",
            margin: "0 0 10px",
            letterSpacing: "-0.02em",
          }}
        >
          Your Project Journey
        </h2>
        <p
          style={{
            fontSize: "12px",
            fontFamily: "monospace",
            color: "var(--text-subtle)",
            margin: "0 auto",
            maxWidth: "280px",
            lineHeight: "1.75",
          }}
        >
          A nopal grows slowly, but it always bears fruit.
          <br />
          Tap a phase to enter.
        </p>
      </div>

      {/* Phase cards with connectors */}
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        {PHASES.map((phase, index) => {
          const isUnlocked = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const isPast = index < currentIndex;

          return (
            <div key={phase}>
              <PhaseJourneyCard
                phase={phase}
                isUnlocked={isUnlocked}
                isCurrent={isCurrent}
                onClick={() => onSelect(phase)}
              />
              {index < PHASES.length - 1 && (
                <JourneyPathConnector unlocked={isPast} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BackToJourneyBar({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        padding: "6px 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "12px",
          fontFamily: "monospace",
          color: "var(--text-subtle)",
          padding: "4px 0",
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        ← Journey
      </button>
    </div>
  );
}

// ── FruitsProjectDetail ────────────────────────────────────────────────────

export default function FruitsProjectDetail() {
  const { user, project, messages, myRole } = useLoaderData<typeof loader>();
  const [activePhase, setActivePhase] = useState<NopalPhase | null>(null);

  return (
    <AppLayout>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <ProjectHeader project={project} myRole={myRole} user={user} />

        {activePhase === null ? (
          <JourneyView project={project} onSelect={setActivePhase} />
        ) : (
          <>
            <BackToJourneyBar onBack={() => setActivePhase(null)} />
            {activePhase === "seed" ? (
              <SeedPhaseView
                project={project}
                messages={messages}
                user={user}
                myRole={myRole}
              />
            ) : (
              <ComingSoonView phase={activePhase} />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
