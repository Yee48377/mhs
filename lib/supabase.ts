import { createClient } from "@supabase/supabase-js";

import { getPublicEnv, getServerEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

export function createBrowserSupabaseClient() {
  const env = getPublicEnv();

  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}

export function createServerSupabaseClient() {
  const env = getPublicEnv();

  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export function createAdminSupabaseClient() {
  const env = getServerEnv();

  return createClient<Database>(env.supabaseUrl, env.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
