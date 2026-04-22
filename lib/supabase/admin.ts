import { createClient } from "@supabase/supabase-js";
import { getNextPublicSupabaseUrl } from "@/lib/supabase/public-env";

/** Service role client — only import from Server Actions / Route Handlers that must bypass RLS. */
export function createSupabaseServiceRoleClient() {
  const url = getNextPublicSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
