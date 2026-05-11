import { CommentThread } from "@/components/comment-thread";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { shortDate } from "@/lib/format";
import type { Comment, Decision, Project } from "@/lib/types";

export function DecisionList({
  decisions,
  comments,
  project,
  path,
}: {
  decisions: Decision[];
  comments: Comment[];
  project: Project;
  path: string;
}) {
  if (decisions.length === 0) {
    return <EmptyState title="No decisions yet" />;
  }

  return (
    <div className="space-y-3">
      {decisions.map((decision) => (
        <div className="space-y-3" key={decision.id}>
          <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={decision.status} />
              <span className="text-xs text-stone-500">
                {shortDate(decision.createdAt)}
              </span>
            </div>
            <h2 className="mt-3 text-base font-semibold">{decision.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-700">
              {decision.decision}
            </p>
            {decision.rationale ? (
              <p className="mt-2 text-sm leading-6 text-stone-500">
                {decision.rationale}
              </p>
            ) : null}
          </article>
          <CommentThread
            comments={comments}
            path={path}
            project={project}
            targetId={decision.id}
            targetType="decision"
          />
        </div>
      ))}
    </div>
  );
}
