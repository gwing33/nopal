import { useEffect, useState } from "react";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
  Form,
  useActionData,
  useLoaderData,
  useFetcher,
} from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
  type Project,
  type ProjectHuman,
  type ProjectRole,
  type ProjectType,
  type Timeline,
} from "../data/projects.server";
import { getHumans, type Human } from "../data/humans.server";
import { Input } from "../components/Input";
import { generateProjectName } from "../util/generateProjectName";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/mrgnt/login");

  const [projectsResult, humansResult] = await Promise.all([
    getProjects(),
    getHumans(),
  ]);

  return {
    projects: projectsResult?.data ?? [],
    humans: humansResult?.data ?? [],
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/mrgnt/login");

  const actorId = user._id;
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  function parseFields() {
    const name = formData.get("name") as string;
    const northStar = formData.get("northStar") as string;
    const type = formData.get("type") as ProjectType;
    const address = formData.get("address") as string;
    const timelineJson = formData.get("timelineJson") as string;
    const costMin = Number(formData.get("costMin") ?? 0);
    const costMax = Number(formData.get("costMax") ?? 0);
    const humansJson = formData.get("humansJson") as string;
    const humans: ProjectHuman[] = humansJson ? JSON.parse(humansJson) : [];
    return {
      name,
      northStar,
      type,
      address,
      timeline: (timelineJson ? JSON.parse(timelineJson) : []) as Timeline,
      costRange: [costMin, costMax] as [number, number],
      humans,
      actorId,
    };
  }

  switch (intent) {
    case "create": {
      try {
        const result = await createProject(parseFields());
        if (!result) {
          return { ok: false, error: "Failed to create project.", intent };
        }
        return { ok: true, error: null, intent };
      } catch (err) {
        console.error(err);
        return { ok: false, error: "Failed to create project.", intent };
      }
    }

    case "update": {
      try {
        const id = formData.get("id") as string;
        const result = await updateProject(id, parseFields());
        if (!result) {
          return { ok: false, error: "Failed to update project.", intent };
        }
        return { ok: true, error: null, intent };
      } catch (err) {
        console.error(err);
        return { ok: false, error: "Failed to update project.", intent };
      }
    }

    case "delete": {
      try {
        const id = formData.get("id") as string;
        await deleteProject(id);
        return { ok: true, error: null, intent };
      } catch (err) {
        console.error(err);
        return { ok: false, error: "Failed to delete project.", intent };
      }
    }

    default:
      return { ok: false, error: "Unknown intent.", intent: "" };
  }
}

// ── Constants ────────────────────────────────────────────────────────────────

const PROJECT_TYPES: ProjectType[] = ["Guide", "Design+Build"];
const PROJECT_ROLES: ProjectRole[] = ["Client", "Guide", "Friend"];

const SELECT_STYLE: React.CSSProperties = {
  padding: "8px",
  background: "white",
  border: "1px solid #baa9c0",
  outline: "none",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getHumanName(humans: Human[], id: string): string {
  return humans.find((h) => h._id === id)?.name ?? id;
}

/** Slice an ISO string to "YYYY-MM-DD" for <input type="date"> */
function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : "";
}

function formatCost(value: number): string {
  return value > 0 ? `$${value.toLocaleString()}` : "—";
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MrgntProjects() {
  const { projects, humans } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const deleteFetcher = useFetcher<typeof action>();

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Team members assigned to the project being created / edited
  const [projectHumans, setProjectHumans] = useState<ProjectHuman[]>([]);
  // Controls for the "add human" row
  const [pendingHumanId, setPendingHumanId] = useState<string>(
    humans[0]?._id ?? ""
  );
  const [pendingRole, setPendingRole] = useState<ProjectRole>("Client");

  // Cost range (controlled so we can sync them when switching projects)
  const [costMin, setCostMin] = useState<number>(0);
  const [costMax, setCostMax] = useState<number>(0);

  // Timeline phases
  const [projectTimeline, setProjectTimeline] = useState<Timeline>([]);
  const [pendingPhaseStart, setPendingPhaseStart] = useState<string>("");
  const [pendingPhaseEnd, setPendingPhaseEnd] = useState<string>("");

  // Project name (controlled so the generator can populate it)
  const [projectName, setProjectName] = useState<string>("");

  // Sync dynamic state whenever the selected project changes
  useEffect(() => {
    setProjectName(selectedProject?.name ?? "");
    setProjectHumans(selectedProject?.humans ?? []);
    setProjectTimeline(selectedProject?.timeline ?? []);
    setCostMin(selectedProject?.costRange?.[0] ?? 0);
    setCostMax(selectedProject?.costRange?.[1] ?? 0);
    setPendingHumanId(humans[0]?._id ?? "");
    setPendingRole("Client");
  }, [selectedProject, humans]);

  // Clear selection after a successful delete
  useEffect(() => {
    if (deleteFetcher.data?.ok) {
      setSelectedProject(null);
    }
  }, [deleteFetcher.data]);

  const isEditing = selectedProject !== null;

  function addHuman() {
    if (!pendingHumanId) return;
    if (projectHumans.some((ph) => ph.humanId === pendingHumanId)) return;
    setProjectHumans((prev) => [
      ...prev,
      { humanId: pendingHumanId, role: pendingRole },
    ]);
  }

  function removeHuman(humanId: string) {
    setProjectHumans((prev) => prev.filter((ph) => ph.humanId !== humanId));
  }

  function addPhase() {
    if (!pendingPhaseStart && !pendingPhaseEnd) return;
    setProjectTimeline((prev) => [
      ...prev,
      [pendingPhaseStart, pendingPhaseEnd],
    ]);
    setPendingPhaseStart("");
    setPendingPhaseEnd("");
  }

  function removePhase(index: number) {
    setProjectTimeline((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-row gap-8">
      {/* ── Left column: project list ──────────────────────────────── */}
      <div className="flex flex-col gap-2" style={{ minWidth: "200px" }}>
        <h2 className="purple-light-text text-xl mb-1">Projects</h2>

        <button
          type="button"
          className="btn-secondary text-sm"
          onClick={() => setSelectedProject(null)}
        >
          + New Project
        </button>

        <ul className="flex flex-col gap-1 mt-2">
          {projects.length === 0 && (
            <li className="text-sm opacity-50">No projects yet.</li>
          )}
          {projects.map((project) => {
            const isSelected = selectedProject?._id === project._id;
            return (
              <li key={project._id}>
                <button
                  type="button"
                  onClick={() => setSelectedProject(project)}
                  className="w-full text-left rounded px-3 py-2 text-sm"
                  style={{
                    background: isSelected
                      ? "rgba(128,0,128,0.08)"
                      : "transparent",
                    border: isSelected
                      ? "1px solid #baa9c0"
                      : "1px solid transparent",
                  }}
                >
                  <div className="font-semibold">{project.name}</div>
                  <div className="text-xs" style={{ opacity: 0.6 }}>
                    {project.type}
                  </div>
                  {project.costRange && (
                    <div className="text-xs" style={{ opacity: 0.4 }}>
                      {formatCost(project.costRange[0])} –{" "}
                      {formatCost(project.costRange[1])}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Right column: create / edit form ───────────────────────── */}
      <div className="flex flex-col gap-4 flex-1" style={{ maxWidth: "480px" }}>
        <h2 className="purple-light-text text-xl">
          {isEditing ? "Edit Project" : "New Project"}
        </h2>

        {/* Success / error feedback */}
        {actionData?.ok && actionData.intent === "create" && (
          <p className="text-sm" style={{ color: "var(--green)" }}>
            Project created successfully.
          </p>
        )}
        {actionData?.ok && actionData.intent === "update" && (
          <p className="text-sm" style={{ color: "var(--green)" }}>
            Project updated successfully.
          </p>
        )}
        {deleteFetcher.data?.ok && (
          <p className="text-sm" style={{ color: "var(--green)" }}>
            Project deleted successfully.
          </p>
        )}
        {actionData && !actionData.ok && actionData.error && (
          <p className="text-red-500 text-sm">{actionData.error}</p>
        )}
        {deleteFetcher.data &&
          !deleteFetcher.data.ok &&
          deleteFetcher.data.error && (
            <p className="text-red-500 text-sm">{deleteFetcher.data.error}</p>
          )}

        {/*
          key= forces React to remount the form on selection change so that
          all defaultValue props are applied fresh.
        */}
        <Form
          key={selectedProject?._id ?? "new"}
          method="post"
          className="flex flex-col gap-4"
        >
          <input
            type="hidden"
            name="intent"
            value={isEditing ? "update" : "create"}
          />
          {isEditing && (
            <input type="hidden" name="id" value={selectedProject._id} />
          )}
          {/* Humans array serialised as JSON */}
          <input
            type="hidden"
            name="humansJson"
            value={JSON.stringify(projectHumans)}
          />
          <input
            type="hidden"
            name="timelineJson"
            value={JSON.stringify(projectTimeline)}
          />

          {/* ── Name ── */}
          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-baseline mb-0.5">
              <label className="text-sm" htmlFor="name">
                Name
              </label>
              <button
                type="button"
                onClick={() => setProjectName(generateProjectName())}
                className="text-xs underline hover:no-underline"
                style={{ opacity: 0.55 }}
                title="Generate a prickly pear–inspired codename"
              >
                🌵 generate
              </button>
            </div>
            <input
              id="name"
              name="name"
              type="text"
              style={{ maxHeight: "40px" }}
              autoComplete="off"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          {/* ── North Star ── */}
          <Input
            label="North Star"
            name="northStar"
            type="textarea"
            defaultValue={selectedProject?.northStar ?? ""}
            required
          />

          {/* ── Type ── */}
          <div className="flex flex-col">
            <label className="text-sm" htmlFor="type">
              Type
            </label>
            <select
              name="type"
              id="type"
              defaultValue={selectedProject?.type ?? "Guide"}
              className="rounded"
              style={SELECT_STYLE}
            >
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* ── Street Address ── */}
          <Input
            label="Street Address"
            name="address"
            defaultValue={selectedProject?.address ?? ""}
          />

          {/* ── Timeline ── */}
          <div className="flex flex-col gap-2">
            <span className="text-sm">Timeline</span>

            {projectTimeline.length > 0 && (
              <ul className="flex flex-col gap-1">
                {projectTimeline.map((phase, i) => (
                  <li
                    key={i}
                    className="flex flex-row items-center justify-between text-sm rounded px-3 py-2"
                    style={{ border: "1px solid #baa9c0" }}
                  >
                    <span>
                      <span className="font-semibold">
                        {toDateInput(phase[0]) || "—"}
                      </span>
                      <span className="mx-1" style={{ opacity: 0.5 }}>
                        →
                      </span>
                      <span className="font-semibold">
                        {toDateInput(phase[1]) || "—"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhase(i)}
                      className="text-xs underline hover:no-underline"
                      style={{ color: "var(--red, #ef4444)" }}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-row gap-2 items-end">
              <div className="flex flex-col flex-1">
                <label className="text-xs" style={{ opacity: 0.6 }}>
                  Start
                </label>
                <input
                  type="date"
                  value={pendingPhaseStart}
                  onChange={(e) => setPendingPhaseStart(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs" style={{ opacity: 0.6 }}>
                  End
                </label>
                <input
                  type="date"
                  value={pendingPhaseEnd}
                  onChange={(e) => setPendingPhaseEnd(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={addPhase}
                className="btn-secondary text-sm"
                style={{ whiteSpace: "nowrap" }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* ── Cost Range ── */}
          <div className="flex flex-col gap-1">
            <span className="text-sm">Cost Range</span>
            <div className="flex flex-row gap-2">
              <div className="flex flex-col flex-1">
                <label
                  className="text-xs"
                  style={{ opacity: 0.6 }}
                  htmlFor="costMin"
                >
                  Min ($)
                </label>
                <input
                  type="number"
                  id="costMin"
                  name="costMin"
                  min={0}
                  value={costMin}
                  onChange={(e) => setCostMin(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label
                  className="text-xs"
                  style={{ opacity: 0.6 }}
                  htmlFor="costMax"
                >
                  Max ($)
                </label>
                <input
                  type="number"
                  id="costMax"
                  name="costMax"
                  min={0}
                  value={costMax}
                  onChange={(e) => setCostMax(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* ── Team ── */}
          <div className="flex flex-col gap-2">
            <span className="text-sm">Team</span>

            {projectHumans.length > 0 && (
              <ul className="flex flex-col gap-1">
                {projectHumans.map((ph) => (
                  <li
                    key={ph.humanId}
                    className="flex flex-row items-center justify-between text-sm rounded px-3 py-2"
                    style={{ border: "1px solid #baa9c0" }}
                  >
                    <span>
                      <span className="font-semibold">
                        {getHumanName(humans, ph.humanId)}
                      </span>
                      <span className="ml-2" style={{ opacity: 0.5 }}>
                        {ph.role}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHuman(ph.humanId)}
                      className="text-xs underline hover:no-underline"
                      style={{ color: "var(--red, #ef4444)" }}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {humans.length === 0 ? (
              <p className="text-xs opacity-50">
                No humans available. Add some humans first.
              </p>
            ) : (
              <div className="flex flex-row gap-2 items-end">
                <div className="flex flex-col flex-1">
                  <label className="text-xs" style={{ opacity: 0.6 }}>
                    Human
                  </label>
                  <select
                    value={pendingHumanId}
                    onChange={(e) => setPendingHumanId(e.target.value)}
                    className="rounded"
                    style={SELECT_STYLE}
                  >
                    {humans.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-xs" style={{ opacity: 0.6 }}>
                    Role
                  </label>
                  <select
                    value={pendingRole}
                    onChange={(e) =>
                      setPendingRole(e.target.value as ProjectRole)
                    }
                    className="rounded"
                    style={SELECT_STYLE}
                  >
                    {PROJECT_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={addHuman}
                  className="btn-secondary text-sm"
                  style={{ whiteSpace: "nowrap" }}
                >
                  + Add
                </button>
              </div>
            )}
          </div>

          {/* ── Submit ── */}
          <div>
            <button type="submit" className="btn-primary">
              {isEditing ? "Update" : "Save"}
            </button>
          </div>
        </Form>

        {isEditing && (
          <deleteFetcher.Form
            method="post"
            className="flex flex-row gap-4 items-center"
          >
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="id" value={selectedProject._id} />
            <button
              type="submit"
              className="text-red-500 text-sm underline hover:no-underline"
            >
              Delete
            </button>
          </deleteFetcher.Form>
        )}
      </div>
    </div>
  );
}
