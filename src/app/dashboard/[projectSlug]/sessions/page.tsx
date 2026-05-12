import { LiveSessionsList } from "@/components/live-sessions-list";
import { WorkFilterBar } from "@/components/work-filter-bar";
import { getProjectWorkspace } from "@/lib/projects";
import {
  collectWorkFilters,
  displayWorkValue,
  matchesWorkFilter,
  normalizeWorkType,
} from "@/lib/work";

type SessionsPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
  searchParams: Promise<{
    workType?: string;
    workLabel?: string;
  }>;
};

export default async function SessionsPage({
  params,
  searchParams,
}: SessionsPageProps) {
  const { projectSlug } = await params;
  const { workType, workLabel } = await searchParams;
  const workspace = await getProjectWorkspace(projectSlug);
  const filters = collectWorkFilters(workspace.sessions);
  const filteredSessions = workspace.sessions.filter((session) =>
    matchesWorkFilter(session, workType, workLabel),
  );
  const visibleSessionIds = new Set(filteredSessions.map((session) => session.id));
  const filteredEvents = workspace.events.filter(
    (event) => !event.sessionId || visibleSessionIds.has(event.sessionId),
  );
  const activeFilterText =
    workType || workLabel
      ? `Filtered by ${[
          workType && displayWorkValue(normalizeWorkType(workType)),
          workLabel && displayWorkValue(normalizeWorkType(workLabel)),
        ]
          .filter(Boolean)
          .join(" · ")}.`
      : "Tag sessions at ingest time so you can separate coding, research, marketing, and distribution work.";

  return (
    <main className="space-y-4 px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Live Sessions</h2>
        <p className="mt-1 text-sm text-stone-600">
          Labeled sessions make it easier to separate coding, research, marketing, and distribution work.
        </p>
        <p className="mt-1 text-xs text-stone-500">{activeFilterText}</p>
      </div>
      <WorkFilterBar
        currentWorkLabel={workLabel}
        currentWorkType={workType}
        path={`/dashboard/${projectSlug}/sessions`}
        workLabels={filters.workLabels}
        workTypes={filters.workTypes}
      />
      <LiveSessionsList
        comments={workspace.comments}
        events={filteredEvents}
        path={`/dashboard/${projectSlug}/sessions`}
        project={workspace.project}
        sessions={filteredSessions}
      />
    </main>
  );
}
