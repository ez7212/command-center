import { displayWorkValue } from "@/lib/work";

export function WorkBadge({
  value,
  variant = "label",
}: {
  value: string;
  variant?: "type" | "label";
}) {
  const className =
    variant === "type"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-stone-200 bg-stone-50 text-stone-600";

  return (
    <span
      className={`rounded-full border px-2 py-1 text-[11px] font-medium ${className}`}
    >
      {displayWorkValue(value)}
    </span>
  );
}
