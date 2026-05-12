import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

type Flags = {
  file: string;
  dryRun: boolean;
  actorEmail: string;
  actorName: string;
  projectSlug?: string;
};

type ProjectRow = {
  id: string;
  slug: string;
};

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
};

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type EventType = "manual_note";

type EventInsert = {
  project_id: string;
  session_id: string | null;
  actor_user_id: string | null;
  actor_name: string;
  type: EventType;
  title: string;
  body: string;
  source: string;
  source_provider: string;
  work_type: string;
  work_labels: string[];
  metadata: Json;
  created_at: string;
};

type Database = {
  public: {
    Tables: {
      projects: {
        Row: ProjectRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      events: {
        Row: EventInsert & { id: string };
        Insert: EventInsert;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      event_type: EventType;
    };
    CompositeTypes: Record<string, never>;
  };
};

type CommandCenterSupabase = SupabaseClient<Database>;

const source = "historical_backfill";
const sourceProvider = "historical_backfill";

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

function parseArgs(args: string[]): Flags {
  const flags: Flags = {
    file: "docs/historical-activity",
    dryRun: false,
    actorEmail: process.env.HISTORICAL_BACKFILL_ACTOR_EMAIL ?? "ericzhu0702@gmail.com",
    actorName: process.env.HISTORICAL_BACKFILL_ACTOR_NAME ?? "Eric",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--dry-run") {
      flags.dryRun = true;
      continue;
    }

    const value = args[index + 1];

    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }

    if (arg === "--file") {
      flags.file = value;
    } else if (arg === "--project") {
      flags.projectSlug = normalizeSlug(value);
    } else if (arg === "--actor-email") {
      flags.actorEmail = value;
    } else if (arg === "--actor-name") {
      flags.actorName = value;
    } else {
      throw new Error(`Unknown flag: ${arg}`);
    }

    index += 1;
  }

  return flags;
}

async function loadEnvFile(path: string) {
  let raw: string;

  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }

    throw error;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const assignment = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length).trim()
      : trimmed;
    const equalsIndex = assignment.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = assignment.slice(0, equalsIndex).trim();
    let value = assignment.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function loadDefaultEnvFiles() {
  await loadEnvFile(resolve(process.cwd(), ".env"));
  await loadEnvFile(resolve(process.cwd(), ".env.local"));
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeLabels(values: string[]) {
  return Array.from(new Set(values.map(normalizeSlug).filter(Boolean)));
}

function buildBody(item: HistoricalEvent) {
  const sections = [
    `Purpose: ${item.purpose}`,
    `Process: ${item.processSummary}`,
  ];

  if (item.priorIssues.length > 0) {
    sections.push(`Prior issues: ${item.priorIssues.join(" ")}`);
  }

  if (item.issuesIdentified.length > 0) {
    sections.push(`Issues identified: ${item.issuesIdentified.join(" ")}`);
  }

  if (item.fixesMade.length > 0) {
    sections.push(`Fixes made: ${item.fixesMade.join(" ")}`);
  }

  sections.push(`Outcome: ${item.outcome}`);

  return sections.join("\n\n");
}

function buildMetadata(item: HistoricalEvent) {
  return {
    historicalBackfillId: item.id,
    projectName: item.projectName,
    startedAt: item.startedAt,
    endedAt: item.endedAt ?? null,
    timePrecision: item.timePrecision,
    confidence: item.confidence,
    testRun: item.testRun ?? null,
    priorIssues: item.priorIssues,
    issuesIdentified: item.issuesIdentified,
    fixesMade: item.fixesMade,
    evidence: item.evidence,
    purpose: item.purpose,
    processSummary: item.processSummary,
    outcome: item.outcome,
  };
}

async function historicalEventFiles(path: string, projectSlug?: string) {
  const resolvedPath = resolve(process.cwd(), path);
  const pathStats = await stat(resolvedPath);

  if (!pathStats.isDirectory()) {
    return [resolvedPath];
  }

  if (projectSlug) {
    return [join(resolvedPath, `${projectSlug}.json`)];
  }

  const entries = await readdir(resolvedPath);
  const files = entries
    .filter((entry) => entry.endsWith(".json"))
    .sort()
    .map((entry) => join(resolvedPath, entry));

  if (files.length === 0) {
    throw new Error(`No historical activity JSON files found in ${path}`);
  }

  return files;
}

async function readHistoricalEvents(path: string, projectSlug?: string) {
  const files = await historicalEventFiles(path, projectSlug);
  const items: HistoricalEvent[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const parsed: unknown = JSON.parse(raw);
    const fileItems = historicalEventsSchema.parse(parsed);
    const filteredItems = projectSlug
      ? fileItems.filter((item) => item.projectSlug === projectSlug)
      : fileItems;

    for (const item of filteredItems) {
      if (seenIds.has(item.id)) {
        throw new Error(`Duplicate historical backfill id: ${item.id}`);
      }

      seenIds.add(item.id);
      items.push(item);
    }
  }

  if (items.length === 0) {
    const scope = projectSlug ? ` for project ${projectSlug}` : "";
    throw new Error(`No historical activity events found${scope}`);
  }

  return items;
}

function requiredEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    supabaseUrl,
    serviceRoleKey,
    isConfigured: Boolean(supabaseUrl && serviceRoleKey),
  };
}

function uniqueProjectSlugs(items: HistoricalEvent[]) {
  return Array.from(new Set(items.map((item) => item.projectSlug))).sort();
}

async function fetchProjects(supabase: CommandCenterSupabase, slugs: string[]) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug")
    .in("slug", slugs);

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as ProjectRow[]).map((project) => [project.slug, project]),
  );
}

async function fetchActor(supabase: CommandCenterSupabase, actorEmail: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", actorEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ProfileRow | null;
}

async function findExistingEvent(
  supabase: CommandCenterSupabase,
  projectId: string,
  backfillId: string,
) {
  const { data, error } = await supabase
    .from("events")
    .select("id")
    .eq("project_id", projectId)
    .eq("source_provider", sourceProvider)
    .contains("metadata", { historicalBackfillId: backfillId })
    .limit(1);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<{ id: string }>;
  return rows[0]?.id ? String(rows[0].id) : null;
}

async function insertHistoricalEvent(
  supabase: CommandCenterSupabase,
  item: HistoricalEvent,
  project: ProjectRow,
  actor: ProfileRow | null,
  fallbackActorName: string,
) {
  const { data, error } = await supabase
    .from("events")
    .insert({
      project_id: project.id,
      session_id: null,
      actor_user_id: actor?.id ?? null,
      actor_name: actor?.full_name ?? fallbackActorName,
      type: "manual_note",
      title: item.title,
      body: buildBody(item),
      source,
      source_provider: sourceProvider,
      work_type: normalizeSlug(item.workType) || "general",
      work_labels: normalizeLabels(item.workLabels),
      metadata: buildMetadata(item) as Json,
      created_at: item.endedAt ?? item.startedAt,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return String((data as { id: string }).id);
}

async function main() {
  await loadDefaultEnvFiles();

  const flags = parseArgs(process.argv.slice(2));
  const items = await readHistoricalEvents(flags.file, flags.projectSlug);
  const slugs = uniqueProjectSlugs(items);
  const env = requiredEnv();

  if (!env.isConfigured) {
    console.log(
      `Validated ${items.length} historical events across ${slugs.length} projects.`,
    );
    console.log(`Projects: ${slugs.join(", ")}`);

    if (flags.dryRun) {
      console.log(
        "Dry run stopped before Supabase checks because env vars are missing.",
      );
      console.log(
        "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to import.",
      );
      return;
    }

    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const supabase = createClient<Database>(env.supabaseUrl!, env.serviceRoleKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const projects = await fetchProjects(supabase, slugs);
  const missingProjects = slugs.filter((slug) => !projects.has(slug));

  if (missingProjects.length > 0) {
    throw new Error(
      `Missing Supabase projects for slugs: ${missingProjects.join(", ")}`,
    );
  }

  const actor = await fetchActor(supabase, flags.actorEmail);
  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    const project = projects.get(item.projectSlug);

    if (!project) {
      throw new Error(`Missing project for ${item.projectSlug}`);
    }

    const existingId = await findExistingEvent(supabase, project.id, item.id);

    if (existingId) {
      skipped += 1;
      continue;
    }

    if (flags.dryRun) {
      inserted += 1;
      continue;
    }

    await insertHistoricalEvent(supabase, item, project, actor, flags.actorName);
    inserted += 1;
  }

  const mode = flags.dryRun ? "dry run ok" : "historical import ok";
  console.log(`${mode}: inserted=${inserted} skipped=${skipped}`);

  if (!actor) {
    console.log(
      `Actor profile not found for ${flags.actorEmail}; imported events will use actor_name only.`,
    );
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`historical import failed: ${message}`);
  process.exitCode = 1;
});
