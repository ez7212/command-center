import { createHash } from "node:crypto";

import { z } from "zod";

import { hasSupabaseServiceEnv } from "@/lib/env";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { normalizeWorkLabels, normalizeWorkType } from "@/lib/work";

export const dynamic = "force-dynamic";

const eventTypes = [
  "agent_started",
  "agent_heartbeat",
  "agent_completed",
  "search_run",
  "code_changed",
  "feature_started",
  "feature_shipped",
  "decision_logged",
  "doc_created",
  "doc_updated",
  "deployment_shipped",
  "manual_note",
] as const;

const jsonObjectSchema = z.record(z.string(), z.unknown());
const workTypeSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .transform((value) => normalizeWorkType(value))
  .default("general");
const workLabelsSchema = z
  .array(z.string().trim().min(1).max(64))
  .max(12)
  .transform((value) => normalizeWorkLabels(value))
  .default([]);

const ingestSchema = z.object({
  token: z.string().min(1),
  projectSlug: z.string().min(1),
  source: z.string().min(1).default("manual"),
  sourceProvider: z.string().min(1).default("manual"),
  session: z
    .object({
      externalSessionId: z.string().min(1).optional(),
      title: z.string().min(1),
      status: z.string().min(1).default("active"),
      workType: workTypeSchema,
      workLabels: workLabelsSchema,
      summary: z.string().optional(),
      metadata: jsonObjectSchema.default({}),
    })
    .optional(),
  event: z.object({
    type: z.enum(eventTypes),
    title: z.string().min(1),
    body: z.string().optional(),
    workType: workTypeSchema,
    workLabels: workLabelsSchema,
    metadata: jsonObjectSchema.default({}),
  }),
});

type IngestPayload = z.infer<typeof ingestSchema>;
type JsonObject = Record<string, unknown>;

function jsonResponse(body: JsonObject, status: number) {
  return Response.json(body, { status });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function redactString(value: string) {
  return value
    .replace(
      /\b(api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)\b\s*[:=]\s*["']?[^"'\s,}]+/gi,
      "$1=[REDACTED]",
    )
    .replace(/\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g, "[REDACTED_JWT]");
}

function shouldRedactKey(key: string) {
  return /(api[_-]?key|token|secret|password|credential|private[_-]?key)/i.test(
    key,
  );
}

function redactMetadata(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map(redactMetadata);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        shouldRedactKey(key) ? "[REDACTED]" : redactMetadata(entry),
      ]),
    );
  }

  return value;
}

function completedAtForStatus(status: string) {
  return status === "completed" ? new Date().toISOString() : null;
}

async function findIngestToken(payload: IngestPayload, tokenHash: string) {
  const supabase = createSupabaseServiceClient();

  const { data: token, error } = await supabase
    .from("ingest_tokens")
    .select(
      "id, project_id, owner_user_id, source_provider, revoked_at, projects(slug)",
    )
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!token) {
    return { status: "invalid" as const, token: null };
  }

  const project = Array.isArray(token.projects)
    ? token.projects[0]
    : token.projects;

  if (!project || project.slug !== payload.projectSlug) {
    return { status: "mismatch" as const, token };
  }

  return { status: "valid" as const, token };
}

async function upsertSession(
  payload: IngestPayload,
  token: {
    project_id: string;
    owner_user_id: string | null;
    source_provider: string;
  },
) {
  if (!payload.session) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();
  const sourceProvider = token.source_provider || payload.sourceProvider;
  const sessionPayload = {
    project_id: token.project_id,
    actor_user_id: token.owner_user_id,
    external_session_id: payload.session.externalSessionId ?? null,
    source_provider: sourceProvider,
    title: payload.session.title,
    status: payload.session.status,
    work_type: payload.session.workType || payload.event.workType,
    work_labels:
      payload.session.workLabels.length > 0
        ? payload.session.workLabels
        : payload.event.workLabels,
    summary: payload.session.summary ?? null,
    last_heartbeat_at:
      payload.session.status === "active" ||
      payload.event.type === "agent_heartbeat"
        ? now
        : null,
    completed_at: completedAtForStatus(payload.session.status),
    metadata: redactMetadata(payload.session.metadata) as JsonObject,
  };

  if (payload.session.externalSessionId) {
    const { data, error } = await supabase
      .from("agent_sessions")
      .upsert(sessionPayload, {
        onConflict: "project_id,source_provider,external_session_id",
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id as string;
  }

  const { data, error } = await supabase
    .from("agent_sessions")
    .insert(sessionPayload)
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

async function insertEvent(
  payload: IngestPayload,
  token: {
    project_id: string;
    owner_user_id: string | null;
    source_provider: string;
  },
  sessionId: string | null,
) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      project_id: token.project_id,
      session_id: sessionId,
      actor_user_id: token.owner_user_id,
      actor_name: "Eric",
      type: payload.event.type,
      title: payload.event.title,
      body: payload.event.body ? redactString(payload.event.body) : null,
      source: payload.source,
      source_provider: token.source_provider || payload.sourceProvider,
      work_type: payload.event.workType,
      work_labels: payload.event.workLabels,
      metadata: redactMetadata(payload.event.metadata) as JsonObject,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

export async function POST(request: Request) {
  if (!hasSupabaseServiceEnv()) {
    return jsonResponse({ ok: false, error: "Ingest is not configured" }, 500);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const parsed = ingestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(
      {
        ok: false,
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  try {
    const payload = parsed.data;
    const tokenHash = hashToken(payload.token);
    const tokenResult = await findIngestToken(payload, tokenHash);

    if (tokenResult.status === "invalid") {
      return jsonResponse({ ok: false, error: "Invalid ingest token" }, 401);
    }

    if (tokenResult.status === "mismatch") {
      return jsonResponse({ ok: false, error: "Token project mismatch" }, 403);
    }

    const sessionId = await upsertSession(payload, tokenResult.token);
    const eventId = await insertEvent(payload, tokenResult.token, sessionId);

    const supabase = createSupabaseServiceClient();
    await supabase
      .from("ingest_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", tokenResult.token.id);

    return jsonResponse({ ok: true, eventId, sessionId }, 200);
  } catch (error) {
    console.error("Ingest failed", error);
    return jsonResponse({ ok: false, error: "Server error" }, 500);
  }
}
