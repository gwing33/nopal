// app/routes/fruits.tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, Link } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import {
  getProjectsByHumanId,
  type Project,
  type ProjectRole,
} from "../data/projects.server";
import { AppLayout } from "../components/AppLayout";
import ProjectCard from "../components/ProjectCard";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const projects = await getProjectsByHumanId(user._id);

  return { user, projects };
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
                (h) => h.humanId === user._id,
              );
              return (
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
                  <ProjectCard
                    project={project}
                    myRole={myHuman?.role ?? "Client"}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
