import type { ActivityEvent, AgentSession } from "@/lib/types";

const knownWorkTypes = [
  "coding",
  "research",
  "marketing",
  "distribution",
  "product",
  "operations",
  "finance",
  "strategy",
  "general",
] as const;

type LabeledWork = {
  workType: string;
  workLabels: string[];
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeWorkType(value: string | null | undefined) {
  const normalized = value ? slugify(value) : "";
  return normalized || "general";
}

export function normalizeWorkLabels(values: string[] | null | undefined) {
  return Array.from(
    new Set(
      (values ?? [])
        .map((value) => slugify(value))
        .filter((value) => value.length > 0),
    ),
  );
}

export function parseWorkLabels(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  if (value.trim().startsWith("[")) {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      throw new Error("--labels JSON must be an array of strings");
    }

    return normalizeWorkLabels(
      parsed.map((entry) => {
        if (typeof entry !== "string") {
          throw new Error("--labels JSON array must contain only strings");
        }

        return entry;
      }),
    );
  }

  return normalizeWorkLabels(value.split(","));
}

export function displayWorkValue(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function collectWorkFilters(items: LabeledWork[]) {
  const workTypes = new Set<string>();
  const workLabels = new Set<string>();

  for (const item of items) {
    workTypes.add(normalizeWorkType(item.workType));

    for (const label of normalizeWorkLabels(item.workLabels)) {
      workLabels.add(label);
    }
  }

  return {
    workTypes: Array.from(workTypes).sort((left, right) => {
      const leftIndex = knownWorkTypes.indexOf(left as (typeof knownWorkTypes)[number]);
      const rightIndex = knownWorkTypes.indexOf(
        right as (typeof knownWorkTypes)[number],
      );

      if (leftIndex !== -1 || rightIndex !== -1) {
        return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
      }

      return left.localeCompare(right);
    }),
    workLabels: Array.from(workLabels).sort(),
  };
}

export function matchesWorkFilter(
  item: LabeledWork,
  workType?: string | null,
  workLabel?: string | null,
) {
  const normalizedType = workType ? normalizeWorkType(workType) : null;
  const normalizedLabel = workLabel ? normalizeWorkType(workLabel) : null;

  if (normalizedType && normalizeWorkType(item.workType) !== normalizedType) {
    return false;
  }

  if (
    normalizedLabel &&
    !normalizeWorkLabels(item.workLabels).includes(normalizedLabel)
  ) {
    return false;
  }

  return true;
}

export function relatedEventsForSession(
  session: AgentSession,
  events: ActivityEvent[],
) {
  return events.filter((event) => event.sessionId === session.id);
}

export function summarizeWorkTypes(items: LabeledWork[]) {
  const totals = new Map<string, number>();

  for (const item of items) {
    const key = normalizeWorkType(item.workType);
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }

  return Array.from(totals.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([workType, count]) => ({ workType, count }));
}
