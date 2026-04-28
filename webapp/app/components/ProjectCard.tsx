import { type Project } from "../data/projects.server";

export default function ProjectCard({ project }: { project: Project }) {
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
        <p className="text-sm subtle-text">{project.northStar}</p>
      )}

      {/* Address */}
      {project.address && (
        <div className="text-sm font-mono">{project.address}</div>
      )}

      <hr
        style={{ borderColor: "currentColor", opacity: 0.12, margin: "0 -4px" }}
      />

      {/* Team count */}
      <div className="text-xs subtle-text">
        {teamCount} {teamCount === 1 ? "team member" : "team members"}
      </div>

      {/* Budget */}
      {hasCost && (
        <div className="text-xs subtle-text">
          <span className="font-bold purple-text">Budget</span>{" "}
          {formatCost(costMin)}
          {costMax > costMin ? ` – ${formatCost(costMax)}` : ""}
        </div>
      )}

      {/* Timeline */}
      {hasPhases && firstStart && lastEnd && (
        <div className="flex gap-4 text-xs subtle-text">
          <span>
            <span className="font-bold purple-text">Start</span>{" "}
            {formatDate(firstStart)}
          </span>
          <span>→</span>
          <span>
            <span className="font-bold purple-text">Est. end</span>{" "}
            {formatDate(lastEnd)}
          </span>
        </div>
      )}
    </div>
  );
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
