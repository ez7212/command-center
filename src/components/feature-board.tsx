import { CommentThread } from "@/components/comment-thread";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { shortDate } from "@/lib/format";
import type { Comment, Feature, FeatureStatus, Project } from "@/lib/types";

const columns: Array<{ status: FeatureStatus; label: string }> = [
  { status: "planned", label: "Planned" },
  { status: "in_progress", label: "In Progress" },
  { status: "review", label: "Review" },
  { status: "shipped", label: "Shipped" },
];

export function FeatureBoard({
  features,
  comments,
  project,
  path,
}: {
  features: Feature[];
  comments: Comment[];
  project: Project;
  path: string;
}) {
  if (features.length === 0) {
    return <EmptyState title="No features yet" />;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-4">
      {columns.map((column) => {
        const items = features.filter((feature) => feature.status === column.status);

        return (
          <section
            className="min-h-52 rounded-lg border border-stone-200 bg-stone-50 p-3"
            key={column.status}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{column.label}</h2>
              <span className="text-xs text-stone-500">{items.length}</span>
            </div>
            <div className="mt-3 space-y-3">
              {items.map((feature) => (
                <div className="space-y-2" key={feature.id}>
                  <article className="rounded-md border border-stone-200 bg-white p-3 shadow-sm">
                    <StatusBadge status={feature.status} />
                    <h3 className="mt-3 text-sm font-semibold">
                      {feature.title}
                    </h3>
                    {feature.description ? (
                      <p className="mt-1 text-sm leading-6 text-stone-600">
                        {feature.description}
                      </p>
                    ) : null}
                    <div className="mt-3 text-xs text-stone-500">
                      {feature.owner ? (
                        <span>Owner: {feature.owner}</span>
                      ) : null}
                      {feature.shippedAt ? (
                        <span className="block">
                          Shipped {shortDate(feature.shippedAt)}
                        </span>
                      ) : null}
                    </div>
                  </article>
                  <CommentThread
                    comments={comments}
                    path={path}
                    project={project}
                    targetId={feature.id}
                    targetType="feature"
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
