import { Bot, Code2, GitBranch, NotebookPen } from "lucide-react";

const sourceStyles: Record<string, string> = {
  codex: "border-blue-200 bg-blue-50 text-blue-800",
  claude: "border-emerald-200 bg-emerald-50 text-emerald-800",
  manual: "border-stone-200 bg-stone-50 text-stone-700",
  github: "border-zinc-300 bg-zinc-100 text-zinc-800",
};

export function SourceBadge({ source }: { source: string }) {
  const normalized = source.toLowerCase();
  const Icon =
    normalized === "github"
      ? GitBranch
      : normalized === "manual"
        ? NotebookPen
        : normalized === "codex"
          ? Code2
          : Bot;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium capitalize ${sourceStyles[normalized] ?? sourceStyles.manual}`}
    >
      <Icon aria-hidden="true" size={13} />
      {source === "claude" ? "Claude Code" : source}
    </span>
  );
}
