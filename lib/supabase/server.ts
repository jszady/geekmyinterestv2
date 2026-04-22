import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabasePublicEnvForServer } from "@/lib/supabase/public-env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const { url, anonKey } = requireSupabasePublicEnvForServer();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          /* set from Server Component — middleware refreshes session */
        }
      },
    },
  });
}
