import { DocumentList } from "@/components/document-list";
import { generalDocuments } from "@/lib/project-documents";
import { getProjectWorkspace } from "@/lib/projects";

type DocumentsPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);
  const documents = generalDocuments(workspace.documents);

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Documents</h2>
        <p className="mt-1 text-sm text-stone-600">
          Strategy, branding, distribution, memos, and supporting docs. Project
          Brief and Backlog have dedicated tabs.
        </p>
      </div>
      <DocumentList
        comments={workspace.comments}
        documents={documents}
        path={`/dashboard/${projectSlug}/documents`}
        project={workspace.project}
      />
    </main>
  );
}
