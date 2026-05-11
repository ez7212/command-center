import { labelize } from "@/lib/format";

const statusStyles: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  completed: "border-stone-200 bg-stone-50 text-stone-700",
  planned: "border-stone-200 bg-white text-stone-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-800",
  review: "border-amber-200 bg-amber-50 text-amber-900",
  shipped: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium capitalize ${statusStyles[status] ?? statusStyles.planned}`}
    >
      {labelize(status)}
    </span>
  );
}
