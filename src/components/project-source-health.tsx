import { CheckCircle2, CircleAlert, FolderCode, TerminalSquare } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { relativeTime } from "@/lib/format";
import type { ProjectSourceSetup } from "@/lib/types";

export function ProjectSourceHealth({
  sourceSetup,
  projectSlug,
}: {
  sourceSetup: ProjectSourceSetup;
  projectSlug: string;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="space-y-4">
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FolderCode size={16} />
            <h2 className="text-sm font-semibold">Mapped local directories</h2>
          </div>
          {sourceSetup.directories.length === 0 ? (
            <div className="mt-3">
              <EmptyState
                title="No local mappings on this host"
                body="Register project directories with agent-log init-project to see setup health here."
              />
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {sourceSetup.directories.map((directory) => (
                <article
                  className="rounded-md border border-stone-200 bg-stone-50 p-3"
                  key={directory.path}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{directory.name}</p>
                    <StatusBadge status={directory.defaultProvider} />
                  </div>
                  <p className="mt-2 overflow-auto text-xs text-stone-500">
                    {directory.path}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {directory.providers.map((provider) => (
                      <span
                        className="rounded-full border border-stone-200 bg-white px-2 py-1 text-xs text-stone-600"
                        key={`${directory.path}-${provider.key}`}
                      >
                        {provider.sourceProvider}
                        {provider.tokenEnv
                          ? ` · ${provider.tokenEnv} ${provider.tokenConfigured ? "set" : "missing"}`
                          : " · no token env"}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <TerminalSquare size={16} />
            <h2 className="text-sm font-semibold">Suggested commands</h2>
          </div>
          <div className="mt-3 space-y-3 text-xs text-stone-600">
            <pre className="overflow-auto rounded-md bg-stone-950 p-3 text-stone-100">
              {`npm run agent-log -- doctor --cwd /path/to/${projectSlug}`}
            </pre>
            <pre className="overflow-auto rounded-md bg-stone-950 p-3 text-stone-100">
              {`npm run agent-log -- --type manual_note --work-type marketing --labels distribution,landing-page --title "Session summary" --body "Tracked non-coding work with labels."`}
            </pre>
          </div>
        </div>
      </section>
      <aside className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Provider health
        </h2>
        <div className="mt-3 space-y-3">
          {sourceSetup.providers.map((provider) => {
            const healthy = provider.tokenConfigured || provider.lastEventAt;

            return (
              <article
                className="rounded-md border border-stone-200 bg-stone-50 p-3"
                key={provider.key}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {healthy ? (
                      <CheckCircle2 className="text-emerald-600" size={16} />
                    ) : (
                      <CircleAlert className="text-amber-600" size={16} />
                    )}
                    <p className="text-sm font-medium capitalize">
                      {provider.sourceProvider}
                    </p>
                  </div>
                  <StatusBadge
                    status={provider.tokenConfigured ? "configured" : "pending"}
                  />
                </div>
                <div className="mt-3 space-y-1 text-xs text-stone-500">
                  <p>Mapped directories: {provider.mappedDirectories}</p>
                  <p>Active sessions: {provider.activeSessions}</p>
                  <p>Last event: {relativeTime(provider.lastEventAt)}</p>
                  <p>Last heartbeat: {relativeTime(provider.lastHeartbeatAt)}</p>
                  <p>
                    Token env: {provider.tokenEnv ?? "Not mapped"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
