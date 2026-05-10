import { createClient } from "@supabase/supabase-js";
import { getNextPublicSupabaseUrl } from "@/lib/supabase/public-env";

/**
 * Short-lived client for password verification only (no cookies / session persistence).
 */
export function createEphemeralAnonAuthClient() {
  const url = getNextPublicSupabaseUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
