"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { addMockEvent } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeWorkLabels, normalizeWorkType, parseWorkLabels } from "@/lib/work";

const eventTypes = [
  "manual_note",
  "search_run",
  "decision_logged",
  "feature_started",
  "feature_shipped",
  "doc_created",
  "doc_updated",
] as const;

const manageRoles = new Set(["owner", "editor"]);

const manualEventSchema = z.object({
  projectId: z.string().uuid(),
  projectSlug: z.string().min(1),
  path: z.string().min(1),
  type: z.enum(eventTypes),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().max(4000).optional().default(""),
  workType: z.string().trim().min(1).max(64),
  labels: z.string().trim().max(500).optional().default(""),
  sessionId: z.string().uuid().optional().or(z.literal("")),
});

async function getProjectRole(projectId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to check project role", error.message);
    return null;
  }

  return data?.role ? String(data.role) : null;
}

export async function createManualEvent(formData: FormData) {
  const user = await requireUser();
  const parsed = manualEventSchema.safeParse({
    projectId: formData.get("projectId"),
    projectSlug: formData.get("projectSlug"),
    path: formData.get("path"),
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body"),
    workType: formData.get("workType"),
    labels: formData.get("labels"),
    sessionId: formData.get("sessionId"),
  });

  if (!parsed.success) {
    return;
  }

  const input = parsed.data;
  const workType = normalizeWorkType(input.workType);
  let workLabels: string[];

  try {
    workLabels = normalizeWorkLabels(parseWorkLabels(input.labels));
  } catch (error) {
    console.error("Failed to parse manual event labels", error);
    return;
  }

  if (!hasSupabaseEnv()) {
    addMockEvent({
      projectId: input.projectId,
      sessionId: input.sessionId || null,
      actorUserId: user.id,
      actorName: user.fullName ?? user.email,
      type: input.type,
      title: input.title,
      body: input.body || null,
      source: "manual",
      sourceProvider: "manual",
      workType,
      workLabels,
      metadata: {
        origin: "dashboard-manual",
      },
    });

    revalidatePath(input.path);
    return;
  }

  const role = await getProjectRole(input.projectId, user.id);

  if (!role || !manageRoles.has(role)) {
    console.error("Manual event creation denied for role", role);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("events").insert({
    project_id: input.projectId,
    session_id: input.sessionId || null,
    actor_user_id: user.id,
    actor_name: user.fullName ?? user.email,
    type: input.type,
    title: input.title,
    body: input.body || null,
    source: "manual",
    source_provider: "manual",
    work_type: workType,
    work_labels: workLabels,
    metadata: {
      origin: "dashboard-manual",
    },
  });

  if (error) {
    console.error("Failed to create manual event", error.message);
    return;
  }

  revalidatePath(input.path);
}
