"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicEnvForBrowser } from "@/lib/supabase/public-env";

export function createSupabaseBrowserClient() {
  const { url, anonKey } = requireSupabasePublicEnvForBrowser();
  return createBrowserClient(url, anonKey);
}
