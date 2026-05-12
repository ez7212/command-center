import Link from "next/link";

import { CommentThread } from "@/components/comment-thread";
import { SourceBadge } from "@/components/source-badge";
import { StatusBadge } from "@/components/status-badge";
import { WorkBadge } from "@/components/work-badge";
import { relativeTime } from "@/lib/format";
import type { AgentSession, Comment, Project } from "@/lib/types";

function SessionNode({
  session,
  sessions,
  comments,
  project,
  path,
  depth = 0,
}: {
  session: AgentSession;
  sessions: AgentSession[];
  comments: Comment[];
  project: Project;
  path: string;
  depth?: number;
}) {
  const children = sessions.filter(
    (candidate) => candidate.parentSessionId === session.id,
  );

  return (
    <div className={depth > 0 ? "border-l border-stone-200 pl-4" : ""}>
      <div className="space-y-3">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={session.sourceProvider} />
            <StatusBadge status={session.status} />
            <span className="text-xs text-stone-500">
              Last heartbeat {relativeTime(session.lastHeartbeatAt)}
            </span>
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <Link
                className="text-base font-semibold hover:text-stone-700"
                href={`/dashboard/${project.slug}/sessions/${session.id}`}
              >
                {session.title}
              </Link>
              {session.summary ? (
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {session.summary}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <WorkBadge value={session.workType} variant="type" />
            {session.workLabels.map((label) => (
              <WorkBadge key={`${session.id}-${label}`} value={label} />
            ))}
          </div>
        </div>
        <CommentThread
          comments={comments}
          path={path}
          project={project}
          targetId={session.id}
          targetType="session"
        />
      </div>
      {children.length > 0 ? (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <SessionNode
              depth={depth + 1}
              key={child.id}
              comments={comments}
              path={path}
              project={project}
              session={child}
              sessions={sessions}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AgentSessionTree({
  sessions,
  comments,
  project,
  path,
}: {
  sessions: AgentSession[];
  comments: Comment[];
  project: Project;
  path: string;
}) {
  const roots = sessions.filter(
    (session) =>
      !session.parentSessionId ||
      !sessions.some((candidate) => candidate.id === session.parentSessionId),
  );

  return (
    <div className="space-y-3">
      {roots.map((session) => (
        <SessionNode
          comments={comments}
          key={session.id}
          path={path}
          project={project}
          session={session}
          sessions={sessions}
        />
      ))}
    </div>
  );
}
