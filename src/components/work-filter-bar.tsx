import Link from "next/link";

import { WorkBadge } from "@/components/work-badge";
import { displayWorkValue } from "@/lib/work";

function buildHref(
  path: string,
  values: {
    workType?: string | null;
    workLabel?: string | null;
  },
) {
  const search = new URLSearchParams();

  if (values.workType) {
    search.set("workType", values.workType);
  }

  if (values.workLabel) {
    search.set("workLabel", values.workLabel);
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function WorkFilterBar({
  path,
  currentWorkType,
  currentWorkLabel,
  workTypes,
  workLabels,
}: {
  path: string;
  currentWorkType?: string | null;
  currentWorkLabel?: string | null;
  workTypes: string[];
  workLabels: string[];
}) {
  return (
    <section className="space-y-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Filter activity
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterChip
            active={!currentWorkType}
            href={buildHref(path, { workLabel: currentWorkLabel })}
            label="All work"
          />
          {workTypes.map((workType) => (
            <FilterChip
              active={currentWorkType === workType}
              href={buildHref(path, {
                workType,
                workLabel: currentWorkLabel,
              })}
              key={workType}
              label={displayWorkValue(workType)}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Labels
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <FilterChip
            active={!currentWorkLabel}
            href={buildHref(path, { workType: currentWorkType })}
            label="All labels"
          />
          {workLabels.map((label) => (
            <Link
              className={`rounded-full ${
                currentWorkLabel === label
                  ? "ring-2 ring-stone-300"
                  : "hover:border-stone-300"
              }`}
              href={buildHref(path, {
                workType: currentWorkType,
                workLabel: label,
              })}
              key={label}
            >
              <WorkBadge value={label} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
        active
          ? "border-stone-950 bg-stone-950 text-white"
          : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300"
      }`}
      href={href}
    >
      {label}
    </Link>
  );
}
