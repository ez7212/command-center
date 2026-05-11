import {
  Activity,
  FileText,
  Flag,
  GitBranch,
  LayoutDashboard,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

import type { Project } from "@/lib/types";

const links = [
  { label: "Overview", href: "", icon: LayoutDashboard },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Live Sessions", href: "/sessions", icon: GitBranch },
  { label: "Features", href: "/features", icon: ListChecks },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Decisions", href: "/decisions", icon: Flag },
];

export function ProjectRail({
  projects,
  currentProject,
}: {
  projects: Project[];
  currentProject: Project;
}) {
  return (
    <aside className="border-b border-stone-200 bg-stone-950 text-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="px-4 py-4">
        <Link className="block text-base font-semibold tracking-tight" href="/dashboard">
          Command Center
        </Link>
        <p className="mt-1 text-xs text-stone-400">Shared progress</p>
      </div>

      <div className="border-t border-stone-800 px-3 py-3">
        <p className="px-2 text-xs font-medium uppercase tracking-wide text-stone-500">
          Projects
        </p>
        <div className="mt-2 space-y-1">
          {projects.map((project) => (
            <Link
              className={`block rounded-md px-2 py-2 text-sm font-medium ${
                project.id === currentProject.id
                  ? "bg-white text-stone-950"
                  : "text-stone-300 hover:bg-stone-900 hover:text-white"
              }`}
              href={`/dashboard/${project.slug}`}
              key={project.id}
            >
              {project.name}
            </Link>
          ))}
        </div>
      </div>

      <nav className="grid grid-cols-2 gap-1 border-t border-stone-800 px-3 py-3 md:block md:space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-stone-300 hover:bg-stone-900 hover:text-white"
              href={`/dashboard/${currentProject.slug}${item.href}`}
              key={item.label}
            >
              <Icon aria-hidden="true" size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
