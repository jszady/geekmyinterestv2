import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfileRowForUser } from "@/lib/auth/ensure-profile";
import {
  type ProfileRow,
  PROFILES_SELECT_COLUMNS,
} from "@/lib/database.types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SessionUser = {
  user: User;
  profile: ProfileRow | null;
};

/**
 * Loads `profiles` where `profiles.id === user.id` (same as `auth.uid()` in SQL).
 *
 * When `SUPABASE_SERVICE_ROLE_KEY` is set, we **prefer** loading the profile with the
 * service role first so RLS on `profiles` cannot hide `role` from the server (common
 * cause of “I set admin in the DB but /admin redirects”).
 *
 * Without the service key, we use the anon/session client only (must allow
 * `SELECT … WHERE id = auth.uid()` via RLS).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const ensured = await ensureProfileRowForUser(supabase, user);
  if (!ensured.ok && ensured.reason === "email_conflict") {
    return null;
  }

  let profile: ProfileRow | null = null;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    try {
      const service = createSupabaseServiceRoleClient();
      const { data: sr, error: srErr } = await service
        .from("profiles")
        .select(PROFILES_SELECT_COLUMNS)
        .eq("id", user.id)
        .maybeSingle();

      if (srErr) {
        console.error("[auth] profile (service role)", srErr.message);
      } else if (sr) {
        profile = sr as ProfileRow;
      }
    } catch (e) {
      console.error("[auth] service role profile fetch threw", e);
    }
  }

  if (!profile) {
    const { data: anonProfile, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILES_SELECT_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[auth] profile fetch failed (anon)", profileError.message);
    }
    profile = (anonProfile as ProfileRow | null) ?? null;
  }

  return {
    user,
    profile,
  };
}
