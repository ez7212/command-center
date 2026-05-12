import Link from "next/link";

import { WorkBadge } from "@/components/work-badge";
import { relativeTime } from "@/lib/format";
import type { ProjectWorkspace } from "@/lib/types";
import { summarizeWorkTypes } from "@/lib/work";

function latestWorkspaceTimestamp(workspace: ProjectWorkspace) {
  const values = [
    ...workspace.events.map((event) => event.createdAt),
    ...workspace.sessions
      .map((session) => session.lastHeartbeatAt ?? session.startedAt)
      .filter(Boolean),
  ].sort();

  return values[values.length - 1] ?? null;
}

export function AgenticView({
  workspace,
}: {
  workspace: ProjectWorkspace;
}) {
  const focusAreas = summarizeWorkTypes(workspace.events).slice(0, 4);
  const latestTimestamp = latestWorkspaceTimestamp(workspace);
  const staleCutoff = latestTimestamp
    ? new Date(new Date(latestTimestamp).getTime() - 45 * 60 * 1000)
    : null;
  const followUps = workspace.sessions.filter((session) => {
    if (session.status !== "active" || !session.lastHeartbeatAt || !staleCutoff) {
      return false;
    }

    return new Date(session.lastHeartbeatAt) < staleCutoff;
  });
  const nextMoves = [
    ...workspace.features
      .filter((feature) => feature.status === "in_progress")
      .map((feature) => ({
        id: feature.id,
        title: feature.title,
        href: `/dashboard/${workspace.project.slug}/features`,
        detail: feature.description ?? "In progress",
      })),
    ...workspace.decisions.slice(0, 2).map((decision) => ({
      id: decision.id,
      title: decision.title,
      href: `/dashboard/${workspace.project.slug}/decisions`,
      detail: decision.decision,
    })),
  ].slice(0, 4);

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Focus areas
        </h2>
        <div className="mt-3 space-y-3">
          {focusAreas.map((item) => (
            <div
              className="flex items-center justify-between gap-3"
              key={item.workType}
            >
              <WorkBadge value={item.workType} variant="type" />
              <span className="text-sm text-stone-500">{item.count} events</span>
            </div>
          ))}
          {focusAreas.length === 0 ? (
            <p className="text-sm text-stone-500">No labeled work yet.</p>
          ) : null}
        </div>
      </article>
      <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Follow up
        </h2>
        <div className="mt-3 space-y-3">
          {followUps.length > 0 ? (
            followUps.map((session) => (
              <div key={session.id}>
                <p className="text-sm font-medium">{session.title}</p>
                <p className="mt-1 text-xs text-stone-500">
                  Heartbeat {relativeTime(session.lastHeartbeatAt)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500">
              No stale active sessions detected.
            </p>
          )}
        </div>
      </article>
      <article className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Next moves
        </h2>
        <div className="mt-3 space-y-3">
          {nextMoves.map((item) => (
            <Link className="block" href={item.href} key={item.id}>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-xs text-stone-500">{item.detail}</p>
            </Link>
          ))}
          {nextMoves.length === 0 ? (
            <p className="text-sm text-stone-500">
              No next-step signals surfaced yet.
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}
