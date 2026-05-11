import { FeatureBoard } from "@/components/feature-board";
import { getProjectWorkspace } from "@/lib/projects";

type FeaturesPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function FeaturesPage({ params }: FeaturesPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Features</h2>
        <p className="mt-1 text-sm text-stone-600">
          Shared feature progress with read/comment access for collaborators.
        </p>
      </div>
      <FeatureBoard
        comments={workspace.comments}
        features={workspace.features}
        path={`/dashboard/${projectSlug}/features`}
        project={workspace.project}
      />
    </main>
  );
}
