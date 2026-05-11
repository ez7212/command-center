import { MessageSquareText } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import type { Project } from "@/lib/types";

export function ProjectHeader({
  project,
  role,
}: {
  project: Project;
  role?: string;
}) {
  return (
    <header className="border-b border-stone-200 bg-white px-4 py-4 md:px-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            {role ? <StatusBadge status={role} /> : null}
          </div>
          {project.mission ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              {project.mission}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
          <MessageSquareText size={16} />
          David has read and comment access in v0
        </div>
      </div>
    </header>
  );
}
