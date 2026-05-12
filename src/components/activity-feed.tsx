import { ActivityEventCard } from "@/components/activity-event-card";
import { EmptyState } from "@/components/empty-state";
import type { ActivityEvent, AgentSession, Comment, Project } from "@/lib/types";

export function ActivityFeed({
  events,
  project,
  sessions,
  comments,
  path,
}: {
  events: ActivityEvent[];
  project: Project;
  sessions: AgentSession[];
  comments: Comment[];
  path: string;
}) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        body="Codex, Claude, manual updates, and labeled work activity will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <ActivityEventCard
          event={event}
          comments={comments}
          key={event.id}
          path={path}
          project={project}
          session={sessions.find((session) => session.id === event.sessionId)}
        />
      ))}
    </div>
  );
}
