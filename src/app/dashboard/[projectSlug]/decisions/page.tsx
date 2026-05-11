import { DecisionList } from "@/components/decision-list";
import { getProjectWorkspace } from "@/lib/projects";

type DecisionsPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function DecisionsPage({ params }: DecisionsPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Decisions</h2>
        <p className="mt-1 text-sm text-stone-600">
          Product and workflow decisions David can review and discuss.
        </p>
      </div>
      <DecisionList
        comments={workspace.comments}
        decisions={workspace.decisions}
        path={`/dashboard/${projectSlug}/decisions`}
        project={workspace.project}
      />
    </main>
  );
}
