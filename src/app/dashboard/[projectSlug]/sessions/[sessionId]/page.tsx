import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentThread } from "@/components/comment-thread";
import { SourceBadge } from "@/components/source-badge";
import { StatusBadge } from "@/components/status-badge";
import { WorkBadge } from "@/components/work-badge";
import { relativeTime, shortDate } from "@/lib/format";
import { getProjectWorkspace } from "@/lib/projects";
import { relatedEventsForSession } from "@/lib/work";

type SessionDetailPageProps = {
  params: Promise<{
    projectSlug: string;
    sessionId: string;
  }>;
};

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { projectSlug, sessionId } = await params;
  const workspace = await getProjectWorkspace(projectSlug);
  const session = workspace.sessions.find((candidate) => candidate.id === sessionId);

  if (!session) {
    notFound();
  }

  const events = relatedEventsForSession(session, workspace.events);
  const childSessions = workspace.sessions.filter(
    (candidate) => candidate.parentSessionId === session.id,
  );

  return (
    <main className="space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
        <Link className="hover:text-stone-950" href={`/dashboard/${projectSlug}/sessions`}>
          Sessions
        </Link>
        <span>/</span>
        <span>{session.title}</span>
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={session.sourceProvider} />
            <StatusBadge status={session.status} />
            <WorkBadge value={session.workType} variant="type" />
            {session.workLabels.map((label) => (
              <WorkBadge key={`${session.id}-${label}`} value={label} />
            ))}
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {session.title}
          </h1>
          {session.summary ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              {session.summary}
            </p>
          ) : null}
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">
                Started
              </dt>
              <dd className="mt-1 text-sm text-stone-700">
                {shortDate(session.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">
                Last heartbeat
              </dt>
              <dd className="mt-1 text-sm text-stone-700">
                {relativeTime(session.lastHeartbeatAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">
                Child sessions
              </dt>
              <dd className="mt-1 text-sm text-stone-700">
                {childSessions.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">
                Related events
              </dt>
              <dd className="mt-1 text-sm text-stone-700">{events.length}</dd>
            </div>
          </dl>
          {Object.keys(session.metadata).length > 0 ? (
            <details className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-3 text-xs">
              <summary className="cursor-pointer font-medium text-stone-600">
                Session metadata
              </summary>
              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-stone-600">
                {JSON.stringify(session.metadata, null, 2)}
              </pre>
            </details>
          ) : null}
        </article>

        <aside className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Linked work
          </h2>
          <div className="mt-3 space-y-3">
            {events.map((event) => (
              <div
                className="rounded-md border border-stone-200 bg-stone-50 p-3"
                key={event.id}
              >
                <p className="text-sm font-medium">{event.title}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {relativeTime(event.createdAt)}
                </p>
              </div>
            ))}
            {events.length === 0 ? (
              <p className="text-sm text-stone-500">
                No related events were linked to this session.
              </p>
            ) : null}
          </div>
        </aside>
      </section>

      <CommentThread
        comments={workspace.comments}
        path={`/dashboard/${projectSlug}/sessions/${session.id}`}
        project={workspace.project}
        targetId={session.id}
        targetType="session"
      />
    </main>
  );
}
