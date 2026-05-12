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
