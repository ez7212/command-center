import { LiveSessionsList } from "@/components/live-sessions-list";
import { getProjectWorkspace } from "@/lib/projects";

type SessionsPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function SessionsPage({ params }: SessionsPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Live Sessions</h2>
        <p className="mt-1 text-sm text-stone-600">
          V0 starts with Eric&apos;s local telemetry while the dashboard moves toward shared progress.
        </p>
      </div>
      <LiveSessionsList
        comments={workspace.comments}
        events={workspace.events}
        path={`/dashboard/${projectSlug}/sessions`}
        project={workspace.project}
        sessions={workspace.sessions}
      />
    </main>
  );
}
