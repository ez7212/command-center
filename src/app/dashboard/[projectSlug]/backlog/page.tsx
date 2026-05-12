import { DocumentReader } from "@/components/document-reader";
import { backlogDocuments } from "@/lib/project-documents";
import { getProjectWorkspace } from "@/lib/projects";

type BacklogPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function BacklogPage({ params }: BacklogPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);
  const documents = backlogDocuments(
    workspace.project,
    workspace.documents,
    workspace.features,
  );

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Backlog</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
          Living backlog document for major completed work, active priorities,
          and future workflow improvements.
        </p>
      </div>
      <DocumentReader
        comments={workspace.comments}
        documents={documents}
        emptyTitle="No backlog document yet"
        path={`/dashboard/${projectSlug}/backlog`}
        project={workspace.project}
      />
    </main>
  );
}
