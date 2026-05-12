import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  mockAgents,
  mockDecisions,
  mockDocuments,
  mockFeatures,
  mockProjects,
} from "../src/lib/mock-data";

type Flags = {
  dryRun: boolean;
};

type AnyRecord = Record<string, unknown>;
type SupabaseResult = {
  data: unknown;
  error: unknown;
};
type SupabaseQuery = PromiseLike<SupabaseResult> & {
  select: (...args: unknown[]) => SupabaseQuery;
  insert: (values: unknown) => SupabaseQuery;
  update: (values: unknown) => SupabaseQuery;
  eq: (column: string, value: unknown) => SupabaseQuery;
  in: (column: string, values: unknown[]) => SupabaseQuery;
  limit: (count: number) => SupabaseQuery;
};
type LooseSupabaseClient = {
  from: (relation: string) => SupabaseQuery;
};

type ProjectRow = {
  id: string;
  slug: string;
};

const projectDocs: Record<
  string,
  Array<{
    title: string;
    kind: string;
    path: string;
  }>
> = {
  "command-center": [
    {
      title: "Command Center Project Brief",
      kind: "project_brief",
      path: "PROJECT_BRIEF.md",
    },
    {
      title: "Command Center Backlog",
      kind: "backlog",
      path: "docs/BACKLOG.md",
    },
  ],
  dalya: [
    {
      title: "Dalya Project Brief",
      kind: "project_brief",
      path: "/Users/eric/dalya-ai/PROJECT_BRIEF.md",
    },
    {
      title: "Dalya Backlog",
      kind: "backlog",
      path: "/Users/eric/dalya-ai/BACKLOG.md",
    },
  ],
  buriza: [
    {
      title: "Buriza Project Brief",
      kind: "project_brief",
      path: "/Users/eric/buriza-website/PROJECT_BRIEF.md",
    },
    {
      title: "Buriza Backlog",
      kind: "backlog",
      path: "/Users/eric/buriza-website/BACKLOG.md",
    },
  ],
  "zaya-life": [
    {
      title: "Zaya Life Project Brief",
      kind: "project_brief",
      path: "/Users/eric/surrogacy-site/PROJECT_BRIEF.md",
    },
    {
      title: "Zaya Life Website Backlog",
      kind: "backlog",
      path: "/Users/eric/surrogacy-site/BACKLOG.md",
    },
    {
      title: "Zaya Life Research Project Brief",
      kind: "project_brief",
      path: "/Users/eric/surrogacy-website-research/PROJECT_BRIEF.md",
    },
    {
      title: "Zaya Life Research Backlog",
      kind: "backlog",
      path: "/Users/eric/surrogacy-website-research/BACKLOG.md",
    },
  ],
};

function parseArgs(args: string[]): Flags {
  const flags = { dryRun: false };

  for (const arg of args) {
    if (arg === "--dry-run") {
      flags.dryRun = true;
      continue;
    }

    throw new Error(`Unknown flag: ${arg}`);
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

function requiredEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return { supabaseUrl, serviceRoleKey };
}

async function readMarkdown(path: string) {
  return readFile(resolve(process.cwd(), path), "utf8");
}

function projectByMockId(realProjects: Map<string, ProjectRow>, mockProjectId: string) {
  const mockProject = mockProjects.find((project) => project.id === mockProjectId);

  if (!mockProject) {
    throw new Error(`Missing mock project for id ${mockProjectId}`);
  }

  const project = realProjects.get(mockProject.slug);

  if (!project) {
    throw new Error(`Missing Supabase project for slug ${mockProject.slug}`);
  }

  return project;
}

async function findByProjectAndTitle(
  supabase: LooseSupabaseClient,
  table: string,
  projectId: string,
  title: string,
  extraFilters: Record<string, string> = {},
) {
  let query = supabase
    .from(table)
    .select("id")
    .eq("project_id", projectId)
    .eq("title", title)
    .limit(1);

  for (const [key, value] of Object.entries(extraFilters)) {
    query = query.eq(key, value);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<{ id: string }>)[0]?.id ?? null;
}

async function upsertProjectDocument({
  dryRun,
  supabase,
  projectId,
  title,
  kind,
  bodyMd,
}: {
  dryRun: boolean;
  supabase: LooseSupabaseClient;
  projectId: string;
  title: string;
  kind: string;
  bodyMd: string | null;
}) {
  const payload = {
    project_id: projectId,
    title,
    kind,
    body_md: bodyMd,
    external_url: null,
    updated_at: new Date().toISOString(),
  };
  const existingId = await findByProjectAndTitle(supabase, "documents", projectId, title, {
    kind,
  });

  if (dryRun) {
    return existingId ? "update" : "insert";
  }

  const { error } = existingId
    ? await supabase.from("documents").update(payload).eq("id", existingId)
    : await supabase.from("documents").insert(payload);

  if (error) {
    throw error;
  }

  return existingId ? "update" : "insert";
}

async function upsertFeature({
  dryRun,
  supabase,
  projectId,
  title,
  description,
  status,
  owner,
  shippedAt,
}: {
  dryRun: boolean;
  supabase: LooseSupabaseClient;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  owner: string | null;
  shippedAt: string | null;
}) {
  const payload = {
    project_id: projectId,
    title,
    description,
    status,
    owner,
    shipped_at: shippedAt,
    updated_at: new Date().toISOString(),
  };
  const existingId = await findByProjectAndTitle(supabase, "features", projectId, title);

  if (dryRun) {
    return existingId ? "update" : "insert";
  }

  const { error } = existingId
    ? await supabase.from("features").update(payload).eq("id", existingId)
    : await supabase.from("features").insert(payload);

  if (error) {
    throw error;
  }

  return existingId ? "update" : "insert";
}

async function upsertDecision({
  dryRun,
  supabase,
  projectId,
  title,
  decision,
  rationale,
  status,
  createdAt,
}: {
  dryRun: boolean;
  supabase: LooseSupabaseClient;
  projectId: string;
  title: string;
  decision: string;
  rationale: string | null;
  status: string;
  createdAt: string;
}) {
  const payload = {
    project_id: projectId,
    title,
    decision,
    rationale,
    status,
    created_at: createdAt,
  };
  const existingId = await findByProjectAndTitle(supabase, "decisions", projectId, title);

  if (dryRun) {
    return existingId ? "update" : "insert";
  }

  const { error } = existingId
    ? await supabase.from("decisions").update(payload).eq("id", existingId)
    : await supabase.from("decisions").insert(payload);

  if (error) {
    throw error;
  }

  return existingId ? "update" : "insert";
}

async function upsertAgent({
  dryRun,
  supabase,
  projectId,
  name,
  provider,
  kind,
}: {
  dryRun: boolean;
  supabase: LooseSupabaseClient;
  projectId: string;
  name: string;
  provider: string;
  kind: string | null;
}) {
  const { data, error } = await supabase
    .from("agents")
    .select("id")
    .eq("project_id", projectId)
    .eq("provider", provider)
    .limit(1);

  if (error) {
    throw error;
  }

  const existingId = ((data ?? []) as Array<{ id: string }>)[0]?.id ?? null;
  const payload = {
    project_id: projectId,
    name,
    provider,
    kind,
  };

  if (dryRun) {
    return existingId ? "update" : "insert";
  }

  const result = existingId
    ? await supabase.from("agents").update(payload).eq("id", existingId)
    : await supabase.from("agents").insert(payload);

  if (result.error) {
    throw result.error;
  }

  return existingId ? "update" : "insert";
}

function increment(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

async function main() {
  await loadDefaultEnvFiles();

  const flags = parseArgs(process.argv.slice(2));
  const { supabaseUrl, serviceRoleKey } = requiredEnv();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as LooseSupabaseClient;
  const slugs = mockProjects.map((project) => project.slug);
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, slug")
    .in("slug", slugs);

  if (projectsError) {
    throw projectsError;
  }

  const projectMap = new Map(
    ((projects ?? []) as ProjectRow[]).map((project) => [project.slug, project]),
  );
  const missingSlugs = slugs.filter((slug) => !projectMap.has(slug));

  if (missingSlugs.length > 0) {
    throw new Error(`Missing Supabase projects: ${missingSlugs.join(", ")}`);
  }

  const counts: Record<string, number> = {};

  for (const agent of mockAgents) {
    const project = projectByMockId(projectMap, agent.projectId);
    const action = await upsertAgent({
      dryRun: flags.dryRun,
      supabase,
      projectId: project.id,
      name: agent.name,
      provider: agent.provider,
      kind: agent.kind,
    });
    increment(counts, `agents_${action}`);
  }

  for (const document of mockDocuments) {
    const project = projectByMockId(projectMap, document.projectId);
    const action = await upsertProjectDocument({
      dryRun: flags.dryRun,
      supabase,
      projectId: project.id,
      title: document.title,
      kind: document.kind,
      bodyMd: document.bodyMd,
    });
    increment(counts, `documents_${action}`);
  }

  for (const [slug, docs] of Object.entries(projectDocs)) {
    const project = projectMap.get(slug);

    if (!project) {
      throw new Error(`Missing Supabase project for slug ${slug}`);
    }

    for (const document of docs) {
      const bodyMd = await readMarkdown(document.path);
      const action = await upsertProjectDocument({
        dryRun: flags.dryRun,
        supabase,
        projectId: project.id,
        title: document.title,
        kind: document.kind,
        bodyMd,
      });
      increment(counts, `documents_${action}`);
    }
  }

  for (const feature of mockFeatures) {
    const project = projectByMockId(projectMap, feature.projectId);
    const action = await upsertFeature({
      dryRun: flags.dryRun,
      supabase,
      projectId: project.id,
      title: feature.title,
      description: feature.description,
      status: feature.status,
      owner: feature.owner,
      shippedAt: feature.shippedAt,
    });
    increment(counts, `features_${action}`);
  }

  for (const decision of mockDecisions) {
    const project = projectByMockId(projectMap, decision.projectId);
    const action = await upsertDecision({
      dryRun: flags.dryRun,
      supabase,
      projectId: project.id,
      title: decision.title,
      decision: decision.decision,
      rationale: decision.rationale,
      status: decision.status,
      createdAt: decision.createdAt,
    });
    increment(counts, `decisions_${action}`);
  }

  const mode = flags.dryRun ? "dry run ok" : "project content sync ok";
  const summary = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  console.log(`${mode}: ${summary}`);
}

main().catch((error: unknown) => {
  const details =
    error && typeof error === "object"
      ? (error as AnyRecord)
      : { message: String(error) };
  console.error("project content sync failed:", details);
  process.exitCode = 1;
});
