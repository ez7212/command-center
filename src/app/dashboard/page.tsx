import Link from "next/link";

import { getCurrentUserProjects } from "@/lib/projects";

export default async function DashboardPage() {
  const projects = await getCurrentUserProjects();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
          Projects
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Current workspace
        </h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {projects.map((project) => (
          <Link
            className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow"
            href={`/dashboard/${project.slug}`}
            key={project.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <p className="mt-1 text-sm text-stone-600">
                  {project.description}
                </p>
              </div>
              {project.role ? (
                <span className="rounded-full border border-stone-200 px-2 py-1 text-xs capitalize text-stone-600">
                  {project.role}
                </span>
              ) : null}
            </div>
            {project.mission ? (
              <p className="mt-4 text-sm leading-6 text-stone-700">
                {project.mission}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </main>
  );
}
