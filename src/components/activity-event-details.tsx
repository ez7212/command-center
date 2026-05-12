import { shortDate } from "@/lib/format";
import type { ActivityEvent, JsonRecord } from "@/lib/types";

const historicalKeys = [
  "historicalBackfillId",
  "projectName",
  "startedAt",
  "endedAt",
  "timePrecision",
  "confidence",
  "testRun",
  "priorIssues",
  "issuesIdentified",
  "fixesMade",
  "evidence",
  "purpose",
  "processSummary",
  "outcome",
];

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function visibleMetadata(metadata: JsonRecord) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) => {
      if (historicalKeys.includes(key)) {
        return false;
      }

      if (value === null || value === undefined) {
        return false;
      }

      if (Array.isArray(value) && value.length === 0) {
        return false;
      }

      return true;
    }),
  );
}

function Section({
  title,
  body,
}: {
  title: string;
  body: string | null;
}) {
  if (!body) {
    return null;
  }

  return (
    <section className="rounded-md border border-stone-200 bg-white p-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-stone-700">{body}</p>
    </section>
  );
}

function BulletSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-md border border-stone-200 bg-white p-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-stone-700">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function parseBodyLines(body: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function BodyDetails({ body }: { body: string | null }) {
  if (!body) {
    return null;
  }

  const blocks = parseBodyLines(body);

  return (
    <div className="mt-3 space-y-2">
      {blocks.map((block) => {
        const match = block.match(/^([A-Z][A-Za-z ]+):\s*([\s\S]+)$/);

        if (match) {
          return <Section body={match[2].trim()} key={block} title={match[1]} />;
        }

        return (
          <p
            className="rounded-md border border-stone-200 bg-white p-3 text-sm leading-6 text-stone-700"
            key={block}
          >
            {block}
          </p>
        );
      })}
    </div>
  );
}

function EvidenceList({ evidence }: { evidence: string[] }) {
  if (evidence.length === 0) {
    return null;
  }

  return (
    <details className="rounded-md border border-stone-200 bg-white p-3 text-xs">
      <summary className="cursor-pointer font-medium text-stone-600">
        Evidence ({evidence.length})
      </summary>
      <ul className="mt-2 space-y-1 text-stone-600">
        {evidence.map((item) => (
          <li className="break-all" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

function HistoricalDetails({ event }: { event: ActivityEvent }) {
  const metadata = event.metadata;
  const startedAt = asString(metadata.startedAt);
  const endedAt = asString(metadata.endedAt);
  const confidence = asString(metadata.confidence);
  const timePrecision = asString(metadata.timePrecision);
  const purpose = asString(metadata.purpose);
  const processSummary = asString(metadata.processSummary);
  const outcome = asString(metadata.outcome);
  const priorIssues = asStringList(metadata.priorIssues);
  const issuesIdentified = asStringList(metadata.issuesIdentified);
  const fixesMade = asStringList(metadata.fixesMade);
  const evidence = asStringList(metadata.evidence);
  const renderedMetadata = visibleMetadata(metadata);

  return (
    <div className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
        {startedAt ? <span>Started: {shortDate(startedAt)}</span> : null}
        {endedAt ? <span>Ended: {shortDate(endedAt)}</span> : null}
        {timePrecision ? <span>Timing: {timePrecision}</span> : null}
        {confidence ? <span>Confidence: {confidence}</span> : null}
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <Section body={purpose} title="Purpose" />
        <Section body={processSummary} title="Process" />
        <Section body={outcome} title="Outcome" />
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-3">
        <BulletSection items={priorIssues} title="Before" />
        <BulletSection items={issuesIdentified} title="Issues Found" />
        <BulletSection items={fixesMade} title="Fixes Made" />
      </div>

      <div className="mt-2 space-y-2">
        <EvidenceList evidence={evidence} />
        <MetadataDisclosure metadata={renderedMetadata} />
      </div>
    </div>
  );
}

function MetadataDisclosure({ metadata }: { metadata: JsonRecord }) {
  if (Object.keys(metadata).length === 0) {
    return null;
  }

  return (
    <details className="rounded-md border border-stone-200 bg-white p-3 text-xs">
      <summary className="cursor-pointer font-medium text-stone-600">
        Additional metadata
      </summary>
      <pre className="mt-2 overflow-auto whitespace-pre-wrap text-stone-600">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    </details>
  );
}

export function ActivityEventDetails({ event }: { event: ActivityEvent }) {
  const isHistoricalEvent =
    typeof event.metadata.historicalBackfillId === "string";

  if (isHistoricalEvent) {
    return <HistoricalDetails event={event} />;
  }

  return (
    <>
      <BodyDetails body={event.body} />
      <div className="mt-3">
        <MetadataDisclosure metadata={event.metadata} />
      </div>
    </>
  );
}
