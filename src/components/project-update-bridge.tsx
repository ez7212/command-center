"use client";

import { useRealtimeProjectUpdates } from "@/lib/use-realtime-project-updates";

export function ProjectUpdateBridge({ projectId }: { projectId: string }) {
  useRealtimeProjectUpdates(projectId);
  return null;
}
