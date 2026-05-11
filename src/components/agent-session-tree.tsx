import { SourceBadge } from "@/components/source-badge";
import { StatusBadge } from "@/components/status-badge";
import { relativeTime } from "@/lib/format";
import type { AgentSession } from "@/lib/types";

function SessionNode({
  session,
  sessions,
  depth = 0,
}: {
  session: AgentSession;
  sessions: AgentSession[];
  depth?: number;
}) {
  const children = sessions.filter(
    (candidate) => candidate.parentSessionId === session.id,
  );

  return (
    <div className={depth > 0 ? "border-l border-stone-200 pl-4" : ""}>
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source={session.sourceProvider} />
          <StatusBadge status={session.status} />
          <span className="text-xs text-stone-500">
            Last heartbeat {relativeTime(session.lastHeartbeatAt)}
          </span>
        </div>
        <h2 className="mt-3 text-base font-semibold">{session.title}</h2>
        {session.summary ? (
          <p className="mt-1 text-sm leading-6 text-stone-600">
            {session.summary}
          </p>
        ) : null}
      </div>
      {children.length > 0 ? (
        <div className="mt-3 space-y-3">
          {children.map((child) => (
            <SessionNode
              depth={depth + 1}
              key={child.id}
              session={child}
              sessions={sessions}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AgentSessionTree({ sessions }: { sessions: AgentSession[] }) {
  const roots = sessions.filter((session) => !session.parentSessionId);

  return (
    <div className="space-y-3">
      {roots.map((session) => (
        <SessionNode key={session.id} session={session} sessions={sessions} />
      ))}
    </div>
  );
}
