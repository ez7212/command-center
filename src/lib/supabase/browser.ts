"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicEnv, hasSupabaseEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabasePublicEnv();

  return createBrowserClient(url, anonKey);
}

export function isSupabaseBrowserConfigured() {
  return hasSupabaseEnv();
}
