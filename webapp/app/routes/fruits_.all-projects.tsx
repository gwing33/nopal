// app/routes/fruits_.all-projects.tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect, data, useLoaderData, Link } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { getProjects, type Project } from "../data/projects.server";
import { AppLayout } from "../components/AppLayout";
import ProjectCard from "../components/ProjectCard";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  if (user.role !== "Admin" && user.role !== "Super") {
    throw data("Forbidden", { status: 403 });
  }

  const result = await getProjects();
  return { user, projects: result?.data ?? [] };
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
