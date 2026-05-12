import { createManualEvent } from "@/lib/manual-events";
import type { AgentSession, MemberRole, Project } from "@/lib/types";

const eventOptions = [
  { value: "manual_note", label: "Manual note" },
  { value: "search_run", label: "Research" },
  { value: "decision_logged", label: "Decision" },
  { value: "feature_started", label: "Feature started" },
  { value: "feature_shipped", label: "Feature shipped" },
  { value: "doc_created", label: "Document created" },
  { value: "doc_updated", label: "Document updated" },
] as const;

const workTypeOptions = [
  "coding",
  "research",
  "marketing",
  "distribution",
  "product",
  "operations",
  "finance",
  "strategy",
  "general",
];

function canManage(role?: MemberRole) {
  return role === "owner" || role === "editor";
}

export function ManualEventComposer({
  project,
  sessions,
  path,
  role,
  mockPreview = false,
}: {
  project: Project;
  sessions: AgentSession[];
  path: string;
  role?: MemberRole;
  mockPreview?: boolean;
}) {
  if (!mockPreview && !canManage(role)) {
    return (
      <section className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4">
        <h2 className="text-sm font-semibold">Manual updates</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Only owner/editor roles can log manual project activity.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Log manual activity</h2>
          <p className="mt-1 text-sm text-stone-600">
            Capture non-coding work with the same labels used by Codex and Claude sessions.
          </p>
        </div>
        {mockPreview ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
            Mock preview
          </span>
        ) : null}
      </div>
      <form action={createManualEvent} className="mt-4 space-y-4">
        <input name="projectId" type="hidden" value={project.id} />
        <input name="projectSlug" type="hidden" value={project.slug} />
        <input name="path" type="hidden" value={path} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-stone-700">
            Event type
            <select
              className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-900"
              defaultValue="manual_note"
              name="type"
            >
              {eventOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Work type
            <select
              className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-900"
              defaultValue="research"
              name="workType"
            >
              {workTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("-", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium text-stone-700">
          Title
          <input
            className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
            maxLength={160}
            name="title"
            placeholder="Summarize the work that just happened"
            required
            type="text"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Labels
          <input
            className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
            maxLength={500}
            name="labels"
            placeholder="distribution, landing-page, brokerage"
            type="text"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Related session
          <select
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-900"
            defaultValue=""
            name="sessionId"
          >
            <option value="">No linked session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Notes
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-stone-900"
            maxLength={4000}
            name="body"
            placeholder="What changed, what was learned, what should happen next."
          />
        </label>
        <button
          className="rounded-md bg-stone-950 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800"
          type="submit"
        >
          Log activity
        </button>
      </form>
    </section>
  );
}
