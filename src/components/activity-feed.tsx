import { ActivityEventCard } from "@/components/activity-event-card";
import { EmptyState } from "@/components/empty-state";
import type { ActivityEvent, AgentSession, Project } from "@/lib/types";

export function ActivityFeed({
  events,
  project,
  sessions,
}: {
  events: ActivityEvent[];
  project: Project;
  sessions: AgentSession[];
}) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        body="Eric's Codex, Claude Code, and manual updates will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <ActivityEventCard
          event={event}
          key={event.id}
          project={project}
          session={sessions.find((session) => session.id === event.sessionId)}
        />
      ))}
    </div>
  );
}
