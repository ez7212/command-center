import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { z } from "zod";

type Flags = Record<string, string | boolean>;

type RegistryEntry = {
  name: string;
  projectSlug: string;
  defaultProvider: string;
  providers: Record<string, unknown>;
};

type ProjectRegistry = {
  projects: Record<string, RegistryEntry>;
};

const commandCenterRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

const flagMap: Record<string, string> = {
  "--project": "project",
  "--project-name": "projectName",
  "--cwd": "cwd",
  "--registry": "registry",
  "--file": "file",
  "--id": "id",
  "--title": "title",
  "--started-at": "startedAt",
  "--ended-at": "endedAt",
  "--time-precision": "timePrecision",
  "--work-type": "workType",
  "--labels": "labels",
  "--purpose": "purpose",
  "--process": "processSummary",
  "--prior-issues": "priorIssues",
  "--issues": "issuesIdentified",
  "--fixes": "fixesMade",
  "--outcome": "outcome",
  "--confidence": "confidence",
  "--evidence": "evidence",
  "--test-run": "testRun",
  "--sync": "sync",
  "--dry-run": "dryRun",
  "--replace": "replace",
};

const timestampSchema = z.string().refine((value) => {
  return !Number.isNaN(Date.parse(value));
}, "Expected a valid timestamp");

const historicalEventSchema = z.object({
  id: z.string().trim().min(1),
  projectSlug: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  title: z.string().trim().min(1),
  startedAt: timestampSchema,
  endedAt: timestampSchema.optional(),
  timePrecision: z.string().trim().min(1),
  workType: z.string().trim().min(1),
  workLabels: z.array(z.string().trim().min(1)).default([]),
  purpose: z.string().trim().min(1),
  processSummary: z.string().trim().min(1),
  priorIssues: z.array(z.string().trim().min(1)).default([]),
  issuesIdentified: z.array(z.string().trim().min(1)).default([]),
  fixesMade: z.array(z.string().trim().min(1)).default([]),
  outcome: z.string().trim().min(1),
  testRun: z.record(z.string(), z.unknown()).optional(),
  confidence: z.enum(["high", "medium", "low"]),
  evidence: z.array(z.string().trim().min(1)).default([]),
});

const historicalEventsSchema = z.array(historicalEventSchema);

type HistoricalEvent = z.infer<typeof historicalEventSchema>;

function defaultRegistryPath() {
  return (
    process.env.COMMAND_CENTER_PROJECT_REGISTRY ??
    resolve(homedir(), ".command-center/projects.json")
  );
}

function defaultWorkingDir() {
  return (
    process.env.COMMAND_CENTER_WORKING_DIR ??
    process.env.INIT_CWD ??
    process.cwd()
  );
}

function parseFlags(args: string[]) {
  const flags: Flags = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const key = flagMap[arg];

    if (!key) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    const next = args[index + 1];

    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    index += 1;
  }

  return flags;
}

function stringValue(flags: Flags, key: string, fallback?: string) {
  const value = flags[key];

  if (typeof value === "string") {
    return value;
  }

  return fallback;
}

function booleanValue(flags: Flags, key: string) {
  return flags[key] === true;
}

function requireValue(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required value: ${name}`);
  }

  return value;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function parseStringArray(value: string | undefined, separator = ";") {
  if (!value) {
    return [];
  }

  if (value.trim().startsWith("[")) {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      throw new Error("Expected a JSON array of strings");
    }

    return parsed.map((entry) => {
      if (typeof entry !== "string") {
        throw new Error("Expected a JSON array of strings");
      }

      return entry.trim();
    }).filter(Boolean);
  }

  return value
    .split(separator)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseLabels(value: string | undefined) {
  return Array.from(
    new Set(parseStringArray(value, ",").map(normalizeSlug).filter(Boolean)),
  );
}

function parseJsonObject(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed: unknown = JSON.parse(value);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object");
  }

  return parsed as Record<string, unknown>;
}

function normalizePath(path: string) {
  return resolve(path);
}

async function readRegistry(path = defaultRegistryPath()) {
  try {
    const raw = await readFile(path, "utf8");
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || !("projects" in parsed)) {
      throw new Error(`Invalid project registry: ${path}`);
    }

    return parsed as ProjectRegistry;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { projects: {} };
    }

    throw error;
  }
}

function findRegistryEntry(registry: ProjectRegistry, cwd: string) {
  const normalizedCwd = normalizePath(cwd);

  return Object.entries(registry.projects)
    .map(([registeredPath, entry]) => ({
      registeredPath: normalizePath(registeredPath),
      entry,
    }))
    .filter(
      ({ registeredPath }) =>
        normalizedCwd === registeredPath ||
        normalizedCwd.startsWith(`${registeredPath}/`),
    )
    .sort((a, b) => b.registeredPath.length - a.registeredPath.length)[0];
}

function buildId(projectSlug: string, startedAt: string, title: string) {
  const date = startedAt.slice(0, 10);
  const titleSlug = normalizeSlug(title).slice(0, 56) || "activity";
  const digest = createHash("sha256")
    .update(`${projectSlug}:${startedAt}:${title}`)
    .digest("hex")
    .slice(0, 8);

  return `${projectSlug}-${date}-${titleSlug}-${digest}`;
}

async function readEvents(filePath: string) {
  try {
    const raw = await readFile(filePath, "utf8");
    return historicalEventsSchema.parse(JSON.parse(raw));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeEvents(filePath: string, events: HistoricalEvent[]) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(`${filePath}.tmp`, `${JSON.stringify(events, null, 2)}\n`);
  await rename(`${filePath}.tmp`, filePath);
}

function sortEvents(events: HistoricalEvent[]) {
  return [...events].sort((a, b) => {
    const timeSort = Date.parse(a.startedAt) - Date.parse(b.startedAt);

    if (timeSort !== 0) {
      return timeSort;
    }

    return a.id.localeCompare(b.id);
  });
}

async function syncProject(projectSlug: string) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(
      npmCommand,
      ["run", "import-historical-activity", "--", "--project", projectSlug],
      {
        cwd: commandCenterRoot,
        stdio: "inherit",
      },
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`Historical import failed with exit code ${code}`));
    });
  });
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const registry = await readRegistry(stringValue(flags, "registry"));
  const cwd = normalizePath(stringValue(flags, "cwd", defaultWorkingDir()) ?? defaultWorkingDir());
  const match = findRegistryEntry(registry, cwd);
  const projectSlug = normalizeSlug(
    requireValue(
      "--project, COMMAND_CENTER_PROJECT_SLUG, or registry mapping",
      stringValue(flags, "project", process.env.COMMAND_CENTER_PROJECT_SLUG) ??
        match?.entry.projectSlug,
    ),
  );
  const projectName =
    stringValue(flags, "projectName") ??
    match?.entry.name ??
    titleFromSlug(projectSlug);
  const title = requireValue("--title", stringValue(flags, "title"));
  const startedAt = stringValue(flags, "startedAt", new Date().toISOString())!;
  const endedAt = stringValue(flags, "endedAt");
  const event: HistoricalEvent = historicalEventSchema.parse({
    id: stringValue(flags, "id") ?? buildId(projectSlug, startedAt, title),
    projectSlug,
    projectName,
    title,
    startedAt,
    endedAt,
    timePrecision: stringValue(flags, "timePrecision", "exact"),
    workType: stringValue(flags, "workType", "general"),
    workLabels: parseLabels(stringValue(flags, "labels")),
    purpose: requireValue("--purpose", stringValue(flags, "purpose")),
    processSummary: requireValue("--process", stringValue(flags, "processSummary")),
    priorIssues: parseStringArray(stringValue(flags, "priorIssues")),
    issuesIdentified: parseStringArray(stringValue(flags, "issuesIdentified")),
    fixesMade: parseStringArray(stringValue(flags, "fixesMade")),
    outcome: requireValue("--outcome", stringValue(flags, "outcome")),
    testRun: parseJsonObject(stringValue(flags, "testRun")),
    confidence: stringValue(flags, "confidence", "medium"),
    evidence: parseStringArray(stringValue(flags, "evidence")),
  });
  const filePath = resolve(
    commandCenterRoot,
    stringValue(flags, "file", `docs/historical-activity/${projectSlug}.json`)!,
  );
  const events = await readEvents(filePath);
  const existingIndex = events.findIndex((item) => item.id === event.id);

  if (existingIndex !== -1 && !booleanValue(flags, "replace")) {
    throw new Error(
      `Activity id already exists: ${event.id}. Use --replace to update it.`,
    );
  }

  if (existingIndex === -1) {
    events.push(event);
  } else {
    events[existingIndex] = event;
  }

  const sortedEvents = sortEvents(events);

  if (booleanValue(flags, "dryRun")) {
    console.log(JSON.stringify(event, null, 2));
    console.log(`activity-log dry run project=${projectSlug} file=${filePath}`);
    return;
  }

  await writeEvents(filePath, sortedEvents);
  console.log(`activity-log ok project=${projectSlug} id=${event.id}`);
  console.log(`file=${filePath}`);

  if (booleanValue(flags, "sync")) {
    await syncProject(projectSlug);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`activity-log error: ${message}`);
  process.exitCode = 1;
});
