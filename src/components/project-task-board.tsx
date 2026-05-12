import { ArrowRight, MessageSquareText } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { WorkBadge } from "@/components/work-badge";
import { shortDate } from "@/lib/format";
import type { Comment, Feature, FeatureStatus, Project } from "@/lib/types";

type TaskColumnId = "completed" | "ongoing" | "backlog";

const columns: Array<{
  id: TaskColumnId;
  title: string;
  description: string;
  statuses: FeatureStatus[];
}> = [
  {
    id: "completed",
    title: "Completed",
    description: "Shipped or otherwise finished work.",
    statuses: ["shipped"],
  },
  {
    id: "ongoing",
    title: "Ongoing",
    description: "Active work and items currently under review.",
    statuses: ["in_progress", "review"],
  },
  {
    id: "backlog",
    title: "Backlog",
    description: "Planned work that is not active yet.",
    statuses: ["planned"],
  },
];

function labelsForTask(feature: Feature) {
  if (feature.labels && feature.labels.length > 0) {
    return feature.labels;
  }

  const text = `${feature.title} ${feature.description ?? ""}`.toLowerCase();
  const labels = new Set<string>();

  for (const [needle, label] of [
    ["chatbot", "chatbot"],
    ["crm", "crm"],
    ["dashboard", "dashboard"],
    ["website", "website"],
    ["distribution", "distribution"],
    ["marketing", "marketing"],
    ["research", "research"],
    ["ads", "ads"],
    ["test", "testing"],
    ["automation", "automation"],
    ["database", "database"],
    ["intake", "intake"],
  ] as const) {
    if (text.includes(needle)) {
      labels.add(label);
    }
  }

  return Array.from(labels).slice(0, 3);
}

function commentsForTask(comments: Comment[], taskId: string) {
  return comments.filter(
    (comment) => comment.targetType === "feature" && comment.targetId === taskId,
  );
}

export function ProjectTaskBoard({
  comments,
  features,
  project,
}: {
  comments: Comment[];
  features: Feature[];
  project: Project;
}) {
  if (features.length === 0) {
    return <EmptyState title="No tasks yet" />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {columns.map((column) => {
        const tasks = features.filter((feature) =>
          column.statuses.includes(feature.status),
        );

        return (
          <section
            className="min-h-96 rounded-lg border border-stone-200 bg-stone-50 p-3"
            key={column.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  {column.description}
                </p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-stone-600">
                {tasks.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {tasks.length === 0 ? (
                <div className="rounded-md border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-500">
                  No tasks in this lane.
                </div>
              ) : null}

              {tasks.map((task) => {
                const scopedComments = commentsForTask(comments, task.id);
                const labels = labelsForTask(task);

                return (
                  <Link
                    className="block rounded-md border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow"
                    href={`/dashboard/${project.slug}/tasks/${task.id}`}
                    key={task.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <StatusBadge status={task.status} />
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-1 text-stone-400"
                        size={15}
                      />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold leading-5">
                      {task.title}
                    </h3>
                    {task.description ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
                        {task.description}
                      </p>
                    ) : null}

                    {labels.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {labels.map((label) => (
                          <WorkBadge key={label} value={label} />
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-3 text-xs text-stone-500">
                      <span>{task.owner ? `Owner: ${task.owner}` : "No owner"}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquareText aria-hidden="true" size={13} />
                        {scopedComments.length}
                      </span>
                    </div>
                    {task.shippedAt ? (
                      <p className="mt-2 text-xs text-stone-500">
                        Completed {shortDate(task.shippedAt)}
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export { labelsForTask };
