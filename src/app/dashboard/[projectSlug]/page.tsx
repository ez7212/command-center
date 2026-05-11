import Link from "next/link";
import { Activity, FileText, GitBranch, MessageSquareText } from "lucide-react";

import { ActivityFeed } from "@/components/activity-feed";
import { CommentThread } from "@/components/comment-thread";
import { StatusBadge } from "@/components/status-badge";
import { getProjectWorkspace } from "@/lib/projects";

type ProjectPageProps = {
  params: Promise<{
    projectSlug: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectSlug } = await params;
  const workspace = await getProjectWorkspace(projectSlug);
  const activeSessions = workspace.sessions.filter(
    (session) => session.status === "active",
  );
  const shippedFeatures = workspace.features.filter(
    (feature) => feature.status === "shipped",
  );
  const inProgressFeatures = workspace.features.filter(
    (feature) => feature.status === "in_progress",
  );

  return (
    <main className="space-y-6 px-4 py-6 md:px-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-stone-500">
            Mission
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {workspace.project.description}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            {workspace.project.mission}
          </p>
        </div>
        <CommentThread
          comments={workspace.comments}
          path={`/dashboard/${projectSlug}`}
          project={workspace.project}
          targetId={workspace.project.id}
          targetType="project"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          href={`/dashboard/${projectSlug}/sessions`}
          icon={<GitBranch size={18} />}
          label="Active sessions"
          value={activeSessions.length}
        />
        <MetricCard
          href={`/dashboard/${projectSlug}/activity`}
          icon={<Activity size={18} />}
          label="Recent events"
          value={workspace.events.length}
        />
        <MetricCard
          href={`/dashboard/${projectSlug}/features`}
          icon={<StatusBadge status="shipped" />}
          label="Shipped features"
          value={shippedFeatures.length}
        />
        <MetricCard
          href={`/dashboard/${projectSlug}/documents`}
          icon={<FileText size={18} />}
          label="Docs and decisions"
          value={workspace.documents.length + workspace.decisions.length}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <Link
              className="text-sm font-medium text-stone-600 hover:text-stone-950"
              href={`/dashboard/${projectSlug}/activity`}
            >
              View all
            </Link>
          </div>
          <ActivityFeed
            comments={workspace.comments}
            events={workspace.events.slice(0, 3)}
            path={`/dashboard/${projectSlug}`}
            project={workspace.project}
            sessions={workspace.sessions}
          />
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              In progress
            </h2>
            <div className="mt-3 space-y-3">
              {inProgressFeatures.map((feature) => (
                <div key={feature.id}>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquareText size={16} />
              Open comments
            </div>
            <p className="mt-2 text-3xl font-semibold">
              {workspace.comments.length}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function MetricCard({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Link
      className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow"
      href={href}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">{label}</p>
        <div className="text-stone-500">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </Link>
  );
}
