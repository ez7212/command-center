"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  createSupabaseBrowserClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase/browser";

type RealtimeMode = "realtime" | "polling";

function useDebouncedRefresh(delay = 400) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      router.refresh();
    }, delay);
  }, [delay, router]);
}

export function useRealtimeProjectUpdates(projectId: string) {
  const router = useRouter();
  const [mode, setMode] = useState<RealtimeMode>(
    isSupabaseBrowserConfigured() ? "realtime" : "polling",
  );
  const scheduleRefresh = useDebouncedRefresh();

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const pollInterval = window.setInterval(() => {
      router.refresh();
    }, 45_000);

    if (!isSupabaseBrowserConfigured() || mode === "polling") {
      return () => window.clearInterval(pollInterval);
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`project:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
          filter: `project_id=eq.${projectId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_sessions",
          filter: `project_id=eq.${projectId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `project_id=eq.${projectId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "features",
          filter: `project_id=eq.${projectId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `project_id=eq.${projectId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "decisions",
          filter: `project_id=eq.${projectId}`,
        },
        scheduleRefresh,
      )
      .subscribe((status) => {
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setMode("polling");
        }
      });

    return () => {
      window.clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [mode, projectId, router, scheduleRefresh]);

  return mode;
}
