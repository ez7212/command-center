import { ProjectTaskBoard } from "@/components/project-task-board";
import { getProjectWorkspace } from "@/lib/projects";

type TasksPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function TasksPage({ params }: TasksPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);

  return (
    <main className="px-4 py-6 md:px-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Tasks</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
            Trello-style execution board for completed work, active priorities,
            and backlog items. Open any card to review details and comments.
          </p>
        </div>
      </div>
      <ProjectTaskBoard
        comments={workspace.comments}
        features={workspace.features}
        project={workspace.project}
      />
    </main>
  );
}
