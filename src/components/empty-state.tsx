import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body?: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center">
      <Inbox className="text-stone-400" size={24} />
      <h2 className="mt-3 text-sm font-semibold text-stone-900">{title}</h2>
      {body ? <p className="mt-1 max-w-sm text-sm text-stone-500">{body}</p> : null}
    </div>
  );
}
