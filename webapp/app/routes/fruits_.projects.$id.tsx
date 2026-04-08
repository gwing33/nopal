// app/routes/fruits_.projects.$id.tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { Link } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { getProjectById, type ProjectRole } from "../data/projects.server";
import { AppLayout } from "../components/AppLayout";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const { id } = params;
  if (!id) return redirect("/fruits");

  const project = await getProjectById(id);
  if (!project) throw new Response("Project not found", { status: 404 });

  const myHuman = project.humans.find((h) => h.humanId === user._id);
  if (!myHuman) throw new Response("Not authorized", { status: 403 });

  return { user, project, myRole: myHuman.role };
}

function roleLabel(role: ProjectRole): string {
  return role;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCost(value: number): string {
  return value > 0 ? `$${value.toLocaleString()}` : "";
}

export default function FruitsProjectDetail() {
  const { project, myRole } = useLoaderData<typeof loader>();

  const [costMin, costMax] = project.costRange ?? [0, 0];
  const hasCost = costMin > 0 || costMax > 0;
  const hasPhases = project.phases?.length > 0;

  const firstStart = hasPhases ? (project.phases[0] as any)[0] : null;
  const lastEnd = hasPhases
    ? (project.phases[project.phases.length - 1] as any)[1]
    : null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12" style={{ maxWidth: "640px" }}>
        {/* Back link */}
        <div className="mb-8">
          <Link
            to="/fruits"
            className="text-sm font-mono"
            style={{ color: "var(--purple-light)" }}
          >
            ← back to projects
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="font-bold text-2xl leading-tight">{project.name}</h1>
          <span
            className="text-xs px-2 py-0.5 rounded-full shrink-0 mt-1"
            style={{
              background: "var(--farground)",
              border: "1px solid var(--midground)",
              color: "var(--text-subtle)",
            }}
          >
            {project.type}
          </span>
        </div>

        {/* Role badge */}
        <div className="mb-6">
          <span
            className="text-xs font-mono"
            style={{ color: "var(--purple-light)" }}
          >
            your role: {roleLabel(myRole)}
          </span>
        </div>

        {/* Main card */}
        <div className="good-box flex flex-col gap-5 p-6">
          {/* North star */}
          {project.northStar && (
            <div>
              <div
                className="text-xs font-mono mb-1 font-bold"
                style={{ color: "var(--purple)" }}
              >
                North Star
              </div>
              <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
                {project.northStar}
              </p>
            </div>
          )}

          {/* Address */}
          {project.address && (
            <div>
              <div
                className="text-xs font-mono mb-1 font-bold"
                style={{ color: "var(--purple)" }}
              >
                Address
              </div>
              <div className="text-sm font-mono">{project.address}</div>
            </div>
          )}

          {(project.northStar || project.address) && (
            <hr
              style={{
                borderColor: "currentColor",
                opacity: 0.12,
                margin: "0 -4px",
              }}
            />
          )}

          {/* Timeline */}
          {hasPhases && firstStart && lastEnd && (
            <div>
              <div
                className="text-xs font-mono mb-2 font-bold"
                style={{ color: "var(--purple)" }}
              >
                Timeline
              </div>
              <div className="flex flex-col gap-2">
                {project.phases.map((phase, i) => {
                  const p = phase as any;
                  const start = p[0] ?? p.startDate;
                  const end = p[1] ?? p.endDate;
                  const status = p[2] ?? p.status;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-xs"
                      style={{ color: "var(--text-subtle)" }}
                    >
                      <span className="font-mono w-4 text-right opacity-50">
                        {i + 1}.
                      </span>
                      <span>{start ? formatDate(start) : "—"}</span>
                      <span>→</span>
                      <span>{end ? formatDate(end) : "—"}</span>
                      {status && (
                        <span
                          className="px-1.5 py-0.5 rounded font-mono text-xs"
                          style={{
                            background: "var(--farground)",
                            border: "1px solid var(--midground)",
                          }}
                        >
                          {status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget */}
          {hasCost && (
            <div>
              <div
                className="text-xs font-mono mb-1 font-bold"
                style={{ color: "var(--purple)" }}
              >
                Budget
              </div>
              <div className="text-sm" style={{ color: "var(--text-subtle)" }}>
                {formatCost(costMin)}
                {costMax > costMin ? ` – ${formatCost(costMax)}` : ""}
              </div>
            </div>
          )}

          <hr
            style={{
              borderColor: "currentColor",
              opacity: 0.12,
              margin: "0 -4px",
            }}
          />

          {/* Team */}
          <div>
            <div
              className="text-xs font-mono mb-2 font-bold"
              style={{ color: "var(--purple)" }}
            >
              Team
            </div>
            <div className="flex flex-col gap-1">
              {project.humans.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs font-mono"
                  style={{ color: "var(--text-subtle)" }}
                >
                  <span
                    className="px-1.5 py-0.5 rounded"
                    style={{
                      background: "var(--farground)",
                      border: "1px solid var(--midground)",
                      color: "var(--purple-light)",
                    }}
                  >
                    {h.role}
                  </span>
                  <span className="opacity-60">{h.humanId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
