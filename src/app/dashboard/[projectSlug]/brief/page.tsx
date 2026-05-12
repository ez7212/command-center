import { DocumentReader } from "@/components/document-reader";
import { projectBriefDocuments } from "@/lib/project-documents";
import { getProjectWorkspace } from "@/lib/projects";

type BriefPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function BriefPage({ params }: BriefPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);
  const documents = projectBriefDocuments(
    workspace.project,
    workspace.documents,
  );

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Project Brief</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
          Living project overview: mission, product context, built features,
          and current strategy.
        </p>
      </div>
      <DocumentReader
        comments={workspace.comments}
        documents={documents}
        emptyTitle="No project brief yet"
        path={`/dashboard/${projectSlug}/brief`}
        project={workspace.project}
      />
    </main>
  );
}
