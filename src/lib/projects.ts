import "server-only";

import { notFound } from "next/navigation";

import { hasSupabaseEnv } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import {
  getMockWorkspace,
  mockProjects,
  mockWorkspace,
} from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActivityEvent,
  Agent,
  AgentSession,
  Comment,
  Decision,
  Document,
  Feature,
  MemberRole,
  Project,
  ProjectWorkspace,
} from "@/lib/types";
import { normalizeWorkLabels, normalizeWorkType } from "@/lib/work";

type AnyRecord = Record<string, unknown>;

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapProject(row: AnyRecord, role?: MemberRole): Project {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : null,
    mission: row.mission ? String(row.mission) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    role,
  };
}

function mapAgent(row: AnyRecord): Agent {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    name: String(row.name),
    provider: String(row.provider),
    kind: row.kind ? String(row.kind) : null,
    createdAt: String(row.created_at),
  };
}

function mapSession(row: AnyRecord): AgentSession {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    agentId: row.agent_id ? String(row.agent_id) : null,
    parentSessionId: row.parent_session_id
      ? String(row.parent_session_id)
      : null,
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    externalSessionId: row.external_session_id
      ? String(row.external_session_id)
      : null,
    sourceProvider: String(row.source_provider),
    title: String(row.title),
    status: String(row.status),
    workType: normalizeWorkType(
      row.work_type ? String(row.work_type) : "general",
    ),
    workLabels: normalizeWorkLabels(
      Array.isArray(row.work_labels)
        ? row.work_labels.map((value) => String(value))
        : [],
    ),
    summary: row.summary ? String(row.summary) : null,
    startedAt: String(row.started_at),
    lastHeartbeatAt: row.last_heartbeat_at
      ? String(row.last_heartbeat_at)
      : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
  };
}

function mapEvent(row: AnyRecord): ActivityEvent {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    sessionId: row.session_id ? String(row.session_id) : null,
    actorUserId: row.actor_user_id ? String(row.actor_user_id) : null,
    actorName: row.actor_name ? String(row.actor_name) : null,
    type: row.type as ActivityEvent["type"],
    title: String(row.title),
    body: row.body ? String(row.body) : null,
    source: String(row.source),
    sourceProvider: String(row.source_provider),
    workType: normalizeWorkType(
      row.work_type ? String(row.work_type) : "general",
    ),
    workLabels: normalizeWorkLabels(
      Array.isArray(row.work_labels)
        ? row.work_labels.map((value) => String(value))
        : [],
    ),
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: String(row.created_at),
  };
}

function mapComment(row: AnyRecord): Comment {
  const author = firstRelation<AnyRecord>(
    row.profiles as AnyRecord | AnyRecord[] | null | undefined,
  );

  return {
    id: String(row.id),
    projectId: String(row.project_id),
    targetType: String(row.target_type),
    targetId: String(row.target_id),
    authorId: String(row.author_id),
    authorName: String(author?.full_name ?? author?.email ?? "Commenter"),
    body: String(row.body),
    createdAt: String(row.created_at),
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  };
}

function mapFeature(row: AnyRecord): Feature {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    status: row.status as Feature["status"],
    owner: row.owner ? String(row.owner) : null,
    shippedAt: row.shipped_at ? String(row.shipped_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapDocument(row: AnyRecord): Document {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    kind: String(row.kind),
    bodyMd: row.body_md ? String(row.body_md) : null,
    externalUrl: row.external_url ? String(row.external_url) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapDecision(row: AnyRecord): Decision {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    decision: String(row.decision),
    rationale: row.rationale ? String(row.rationale) : null,
    status: String(row.status),
    createdAt: String(row.created_at),
  };
}

export async function getCurrentUserProjects(): Promise<Project[]> {
  const user = await getCurrentUser();

  if (!hasSupabaseEnv()) {
    return mockProjects;
  }

  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_members")
    .select(
      "role, projects(id, name, slug, description, mission, created_by, created_at, updated_at)",
    )
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to fetch project memberships", error.message);
    return [];
  }

  return (data ?? [])
    .map((row: AnyRecord) => {
      const project = firstRelation<AnyRecord>(
        row.projects as AnyRecord | AnyRecord[] | null | undefined,
      );
      return project ? mapProject(project, row.role as MemberRole) : null;
    })
    .filter((project): project is Project => Boolean(project));
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!hasSupabaseEnv()) {
    return mockProjects.find((project) => project.slug === slug) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, slug, description, mission, created_by, created_at, updated_at")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return mapProject(data);
}

export async function getProjectWorkspace(
  projectSlug = "dalya",
): Promise<ProjectWorkspace> {
  if (!hasSupabaseEnv()) {
    const workspace = getMockWorkspace(projectSlug);

    if (!workspace) {
      notFound();
    }

    return workspace;
  }

  const project = await getProjectBySlug(projectSlug);

  if (!project) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const [
    agentsResult,
    sessionsResult,
    eventsResult,
    commentsResult,
    featuresResult,
    documentsResult,
    decisionsResult,
  ] = await Promise.all([
    supabase.from("agents").select("*").eq("project_id", project.id),
    supabase
      .from("agent_sessions")
      .select("*")
      .eq("project_id", project.id)
      .order("started_at", { ascending: false }),
    supabase
      .from("events")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("comments")
      .select("*, profiles(full_name, email)")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true }),
    supabase.from("features").select("*").eq("project_id", project.id),
    supabase.from("documents").select("*").eq("project_id", project.id),
    supabase
      .from("decisions")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
  ]);

  for (const result of [
    agentsResult,
    sessionsResult,
    eventsResult,
    commentsResult,
    featuresResult,
    documentsResult,
    decisionsResult,
  ]) {
    if (result.error) {
      console.error("Failed to fetch project workspace", result.error.message);
    }
  }

  return {
    project,
    agents: (agentsResult.data ?? []).map(mapAgent),
    sessions: (sessionsResult.data ?? []).map(mapSession),
    events: (eventsResult.data ?? []).map(mapEvent),
    comments: (commentsResult.data ?? []).map(mapComment),
    features: (featuresResult.data ?? []).map(mapFeature),
    documents: (documentsResult.data ?? []).map(mapDocument),
    decisions: (decisionsResult.data ?? []).map(mapDecision),
  };
}

export function getDefaultMockWorkspace() {
  return mockWorkspace;
}
