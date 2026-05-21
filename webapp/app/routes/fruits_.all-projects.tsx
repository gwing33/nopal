// app/routes/fruits_.all-projects.tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect, data, useLoaderData, Link } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { getProjects, type Project } from "../data/projects.server";
import { AppLayout } from "../components/AppLayout";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  if (user.role !== "Admin" && user.role !== "Super") {
    throw data("Forbidden", { status: 403 });
  }

  const result = await getProjects();
  return { user, projects: result?.data ?? [] };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatCost(v: number) {
  return v > 0 ? `$${v.toLocaleString()}` : "";
}

function ProjectCard({ project }: { project: Project }) {
  const [costMin, costMax] = project.costRange ?? [0, 0];
  const hasCost = costMin > 0 || costMax > 0;
  const hasPhases = project.phases?.length > 0;

  const firstStart = hasPhases ? (project.phases[0] as any)[0] : null;
  const lastEnd = hasPhases
    ? (project.phases[project.phases.length - 1] as any)[1]
    : null;

  const teamCount = project.humans?.length ?? 0;

  return (
    <div
      className="good-box flex flex-col gap-3 p-5"
      style={{ maxWidth: "420px" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-bold text-lg leading-tight">{project.name}</h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full shrink-0"
          style={{
            background: "var(--farground)",
            border: "1px solid var(--midground)",
            color: "var(--text-subtle)",
          }}
        >
          {project.type}
        </span>
      </div>

      {/* North star */}
      {project.northStar && (
        <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
          {project.northStar}
        </p>
      )}

      {/* Address */}
      {project.address && (
        <div className="text-sm font-mono">{project.address}</div>
      )}

      <hr
        style={{ borderColor: "currentColor", opacity: 0.12, margin: "0 -4px" }}
      />

      {/* Team count */}
      <div className="text-xs" style={{ color: "var(--text-subtle)" }}>
        {teamCount} {teamCount === 1 ? "team member" : "team members"}
      </div>

      {/* Budget */}
      {hasCost && (
        <div className="text-xs" style={{ color: "var(--text-subtle)" }}>
          <span className="font-bold" style={{ color: "var(--purple)" }}>
            Budget
          </span>{" "}
          {formatCost(costMin)}
          {costMax > costMin ? ` – ${formatCost(costMax)}` : ""}
        </div>
      )}

      {/* Timeline */}
      {hasPhases && firstStart && lastEnd && (
        <div
          className="flex gap-4 text-xs"
          style={{ color: "var(--text-subtle)" }}
        >
          <span>
            <span className="font-bold" style={{ color: "var(--purple)" }}>
              Start
            </span>{" "}
            {formatDate(firstStart)}
          </span>
          <span>→</span>
          <span>
            <span className="font-bold" style={{ color: "var(--purple)" }}>
              Est. end
            </span>{" "}
            {formatDate(lastEnd)}
          </span>
        </div>
      )}
    </div>
  );
}

export default function AllProjects() {
  const { projects } = useLoaderData<typeof loader>();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Back link */}
        <div className="mb-8">
          <Link
            to="/fruits"
            className="text-sm font-mono"
            style={{ color: "var(--purple-light)" }}
          >
            ← back to dashboard
          </Link>
        </div>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="font-bold text-2xl mb-1">All Projects</h1>
          <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
            Admin view · all projects in the system
          </p>
        </div>

        {/* Project list */}
        {projects.length === 0 ? (
          <div
            className="good-box p-6 text-sm"
            style={{ color: "var(--text-subtle)", maxWidth: "420px" }}
          >
            No projects in the system yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => (
              <Link
                key={project._id}
                to={`/fruits/projects/${project._id}`}
                prefetch="intent"
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <ProjectCard project={project} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
