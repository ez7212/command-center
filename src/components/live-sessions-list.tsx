import { AgentSessionTree } from "@/components/agent-session-tree";
import { EmptyState } from "@/components/empty-state";
import type { ActivityEvent, AgentSession } from "@/lib/types";

export function LiveSessionsList({
  sessions,
  events,
}: {
  sessions: AgentSession[];
  events: ActivityEvent[];
}) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        body="Eric's Codex and Claude Code sessions will show up when ingested."
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <AgentSessionTree sessions={sessions} />
      <aside className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Recent session events
        </h2>
        <div className="mt-3 space-y-3">
          {events.slice(0, 6).map((event) => (
            <div key={event.id} className="border-b border-stone-100 pb-3 last:border-0">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="mt-1 text-xs capitalize text-stone-500">
                {event.type.replaceAll("_", " ")}
              </p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
