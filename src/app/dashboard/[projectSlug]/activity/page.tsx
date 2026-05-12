import { ActivityFeed } from "@/components/activity-feed";
import { WorkFilterBar } from "@/components/work-filter-bar";
import { getProjectWorkspace } from "@/lib/projects";
import {
  collectWorkFilters,
  displayWorkValue,
  matchesWorkFilter,
  normalizeWorkType,
} from "@/lib/work";

type ActivityPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
  searchParams: Promise<{
    workType?: string;
    workLabel?: string;
  }>;
};

export default async function ActivityPage({
  params,
  searchParams,
}: ActivityPageProps) {
  const { projectSlug } = await params;
  const { workType, workLabel } = await searchParams;
  const workspace = await getProjectWorkspace(projectSlug);
  const filters = collectWorkFilters(workspace.events);
  const filteredEvents = workspace.events.filter((event) =>
    matchesWorkFilter(event, workType, workLabel),
  );
  const activeFilterText =
    workType || workLabel
      ? `Filtered by ${[
          workType && displayWorkValue(normalizeWorkType(workType)),
          workLabel && displayWorkValue(normalizeWorkType(workLabel)),
        ]
          .filter(Boolean)
          .join(" · ")}.`
      : "Use labels to separate research, coding, marketing, distribution, and other work.";

  return (
    <main className="space-y-4 px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
        <p className="mt-1 text-sm text-stone-600">
          Codex, Claude, manual, and future sources roll up here by work label.
        </p>
        <p className="mt-1 text-xs text-stone-500">{activeFilterText}</p>
      </div>
      <WorkFilterBar
        currentWorkLabel={workLabel}
        currentWorkType={workType}
        path={`/dashboard/${projectSlug}/activity`}
        workLabels={filters.workLabels}
        workTypes={filters.workTypes}
      />
      <ActivityFeed
        comments={workspace.comments}
        events={filteredEvents}
        path={`/dashboard/${projectSlug}/activity`}
        project={workspace.project}
        sessions={workspace.sessions}
      />
    </main>
  );
}
