import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceEnv, hasSupabaseServiceEnv } from "@/lib/env";

export function createSupabaseServiceClient() {
  const { url, serviceRoleKey } = getSupabaseServiceEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isSupabaseServiceConfigured() {
  return hasSupabaseServiceEnv();
}
