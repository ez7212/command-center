import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentThread } from "@/components/comment-thread";
import { labelsForTask } from "@/components/project-task-board";
import { StatusBadge } from "@/components/status-badge";
import { WorkBadge } from "@/components/work-badge";
import { shortDate } from "@/lib/format";
import { getProjectWorkspace } from "@/lib/projects";

type TaskDetailPageProps = {
  params: Promise<{
    projectSlug: string;
    taskId: string;
  }>;
};

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { projectSlug, taskId } = await params;
  const workspace = await getProjectWorkspace(projectSlug);
  const task = workspace.features.find((feature) => feature.id === taskId);

  if (!task) {
    notFound();
  }

  const labels = labelsForTask(task);

  return (
    <main className="space-y-5 px-4 py-6 md:px-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-950"
        href={`/dashboard/${projectSlug}/tasks`}
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to tasks
      </Link>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            {labels.map((label) => (
              <WorkBadge key={label} value={label} />
            ))}
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {task.title}
          </h1>
          {task.description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              {task.description}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 border-t border-stone-100 pt-4 text-sm md:grid-cols-3">
            <DetailMetric label="Owner" value={task.owner ?? "Unassigned"} />
            <DetailMetric label="Created" value={shortDate(task.createdAt)} />
            <DetailMetric label="Updated" value={shortDate(task.updatedAt)} />
            {task.shippedAt ? (
              <DetailMetric label="Completed" value={shortDate(task.shippedAt)} />
            ) : null}
          </div>
        </article>

        <CommentThread
          comments={workspace.comments}
          path={`/dashboard/${projectSlug}/tasks/${task.id}`}
          project={workspace.project}
          targetId={task.id}
          targetType="feature"
        />
      </section>
    </main>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-stone-900">{value}</p>
    </div>
  );
}
