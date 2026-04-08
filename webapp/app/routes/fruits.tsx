// app/routes/fruits.tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getProjectsByHumanId,
  type Project,
  type ProjectRole,
} from "../data/projects.server";
import { AppLayout } from "../components/AppLayout";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const projects = await getProjectsByHumanId(user._id);

  return { user, projects };
}

function roleLabel(role: ProjectRole): string {
  return role;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatCost(value: number): string {
  return value > 0 ? `$${value.toLocaleString()}` : "";
}

function ProjectCard({
  project,
  myRole,
}: {
  project: Project;
  myRole: ProjectRole;
}) {
  const [costMin, costMax] = project.costRange ?? [0, 0];
  const hasCost = costMin > 0 || costMax > 0;
  const hasTimeline = project.timeline?.length > 0;

  // Overall start = first phase start, overall end = last phase end
  const firstStart = hasTimeline ? project.timeline[0][0] : null;
  const lastEnd = hasTimeline
    ? project.timeline[project.timeline.length - 1][1]
    : null;

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

      {/* Role badge */}
      <div>
        <span
          className="text-xs font-mono"
          style={{ color: "var(--purple-light)" }}
        >
          your role: {roleLabel(myRole)}
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

      {/* Timeline */}
      {hasTimeline && firstStart && lastEnd && (
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

      {/* Cost */}
      {hasCost && (
        <div className="text-xs" style={{ color: "var(--text-subtle)" }}>
          <span className="font-bold" style={{ color: "var(--purple)" }}>
            Budget
          </span>{" "}
          {formatCost(costMin)}
          {costMax > costMin ? ` – ${formatCost(costMax)}` : ""}
        </div>
      )}
    </div>
  );
}

export default function Fruits() {
  const { user, projects } = useLoaderData<typeof loader>();

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        {/* Greeting */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl mb-1">
              Hello, {user.name ?? user.email}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-subtle)" }}>
              Here are the projects you're part of.
            </p>
          </div>
        </div>

        {/* Project list */}
        {projects.length === 0 ? (
          <div
            className="good-box p-6 text-sm"
            style={{ color: "var(--text-subtle)", maxWidth: "420px" }}
          >
            You haven't been assigned to any projects yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => {
              const myHuman = project.humans.find(
                (h) => h.humanId === user._id
              );
              return (
                <ProjectCard
                  key={project._id}
                  project={project}
                  myRole={myHuman?.role ?? "Client"}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
