import { ActivityFeed } from "@/components/activity-feed";
import { getProjectWorkspace } from "@/lib/projects";

type ActivityPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
        <p className="mt-1 text-sm text-stone-600">
          Eric&apos;s Codex, Claude Code, manual, and future GitHub updates.
        </p>
      </div>
      <ActivityFeed
        comments={workspace.comments}
        events={workspace.events}
        path={`/dashboard/${projectSlug}/activity`}
        project={workspace.project}
        sessions={workspace.sessions}
      />
    </main>
  );
}
