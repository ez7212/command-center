import { DocumentList } from "@/components/document-list";
import { getProjectWorkspace } from "@/lib/projects";

type DocumentsPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function DocumentsPage({ params }: DocumentsPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Documents</h2>
        <p className="mt-1 text-sm text-stone-600">
          Mission, strategy, branding, distribution, memos, and docs.
        </p>
      </div>
      <DocumentList documents={workspace.documents} />
    </main>
  );
}
