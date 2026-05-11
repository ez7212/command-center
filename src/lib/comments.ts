"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { addMockComment } from "@/lib/mock-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const targetTypes = [
  "project",
  "event",
  "session",
  "feature",
  "document",
  "decision",
] as const;

const commentSchema = z.object({
  projectId: z.string().uuid(),
  projectSlug: z.string().min(1),
  targetType: z.enum(targetTypes),
  targetId: z.string().uuid(),
  body: z.string().trim().min(1, "Comment cannot be blank").max(2000),
  path: z.string().min(1),
});

export async function createComment(formData: FormData) {
  const user = await requireUser();
  const parsed = commentSchema.safeParse({
    projectId: formData.get("projectId"),
    projectSlug: formData.get("projectSlug"),
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    body: formData.get("body"),
    path: formData.get("path"),
  });

  if (!parsed.success) {
    return;
  }

  const input = parsed.data;

  if (!hasSupabaseEnv()) {
    addMockComment({
      projectId: input.projectId,
      targetType: input.targetType,
      targetId: input.targetId,
      authorId: user.id,
      authorName: user.fullName ?? user.email,
      body: input.body,
    });
    revalidatePath(input.path);
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("comments").insert({
    project_id: input.projectId,
    target_type: input.targetType,
    target_id: input.targetId,
    author_id: user.id,
    body: input.body,
  });

  if (error) {
    console.error("Failed to create comment", error.message);
    return;
  }

  revalidatePath(input.path);
}
