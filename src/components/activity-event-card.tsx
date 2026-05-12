import {
  CheckCircle2,
  Code2,
  FileSearch,
  Flag,
  NotebookPen,
  Rocket,
  Search,
} from "lucide-react";

import { ActivityEventDetails } from "@/components/activity-event-details";
import { CommentThread } from "@/components/comment-thread";
import { SourceBadge } from "@/components/source-badge";
import { WorkBadge } from "@/components/work-badge";
import { labelize, relativeTime } from "@/lib/format";
import type { ActivityEvent, AgentSession, Comment, Project } from "@/lib/types";

const iconMap = {
  agent_started: Rocket,
  agent_heartbeat: Rocket,
  agent_completed: CheckCircle2,
  search_run: Search,
  code_changed: Code2,
  feature_started: Flag,
  feature_shipped: CheckCircle2,
  decision_logged: Flag,
  doc_created: FileSearch,
  doc_updated: FileSearch,
  deployment_shipped: Rocket,
  manual_note: NotebookPen,
};

export function ActivityEventCard({
  event,
  project,
  session,
  comments,
  path,
}: {
  event: ActivityEvent;
  project: Project;
  session?: AgentSession;
  comments: Comment[];
  path: string;
}) {
  const Icon = iconMap[event.type];

  return (
    <article className="space-y-3">
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-700">
            <Icon aria-hidden="true" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge source={event.sourceProvider} />
              <span className="text-xs font-medium capitalize text-stone-500">
                {labelize(event.type)}
              </span>
              <span className="text-xs text-stone-400">
                {relativeTime(event.createdAt)}
              </span>
            </div>
            <h2 className="mt-2 text-base font-semibold tracking-tight">
              {event.title}
            </h2>
            <ActivityEventDetails event={event} />
            <div className="mt-3 flex flex-wrap gap-2">
              <WorkBadge value={event.workType} variant="type" />
              {event.workLabels.map((label) => (
                <WorkBadge key={`${event.id}-${label}`} value={label} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
              <span>Actor: {event.actorName ?? "Eric"}</span>
              <span>Project: {project.name}</span>
              {session ? <span>Session: {session.title}</span> : null}
              <span>Comments: {event.commentCount ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
      <CommentThread
        comments={comments}
        path={path}
        project={project}
        targetId={event.id}
        targetType="event"
      />
    </article>
  );
}
