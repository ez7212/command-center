import { ProjectSourceHealth } from "@/components/project-source-health";
import { getProjectSourceSetup } from "@/lib/project-sources";
import { getProjectWorkspace } from "@/lib/projects";

type SetupPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function SetupPage({ params }: SetupPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);
  const sourceSetup = await getProjectSourceSetup(projectSlug, workspace);

  return (
    <main className="space-y-4 px-4 py-6 md:px-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Source setup</h2>
        <p className="mt-1 text-sm text-stone-600">
          Check local project mappings, provider token envs, and recent ingest health for this project.
        </p>
      </div>
      <ProjectSourceHealth
        projectSlug={projectSlug}
        sourceSetup={sourceSetup}
      />
    </main>
  );
}
