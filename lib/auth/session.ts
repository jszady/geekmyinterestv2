import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type ProfileRow,
  PROFILES_SELECT_COLUMNS,
} from "@/lib/database.types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";

export type SessionUser = {
  user: User;
  profile: ProfileRow | null;
};

function logAuth(stage: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") return;
  console.log(`[auth] ${stage}`, payload);
}

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
    logAuth("getSessionUser:no_user", { message: error?.message ?? "" });
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

      logAuth("profile_via_service_role", {
        userId: user.id,
        profileId: sr?.id ?? null,
        role: sr?.role ?? null,
        error: srErr?.message ?? null,
      });

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
    const {
      data: anonProfile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(PROFILES_SELECT_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();

    logAuth("profile_via_anon_session", {
      userId: user.id,
      profileId: anonProfile?.id ?? null,
      role: anonProfile?.role ?? null,
      error: profileError?.message ?? null,
    });

    if (profileError) {
      console.error("[auth] profile fetch failed (anon)", profileError.message);
    }
    profile = (anonProfile as ProfileRow | null) ?? null;
  }

  logAuth("session_summary", {
    userId: user.id,
    fetchedProfileId: profile?.id ?? null,
    fetchedRole: profile?.role ?? null,
    profileSource: profile ? "ok" : "missing",
  });

  if (!profile && process.env.NODE_ENV === "development" && !serviceKey) {
    console.warn(
      "[auth] No profile loaded. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (server-only) so role is read regardless of RLS, or add a policy: SELECT on public.profiles WHERE auth.uid() = id.",
    );
  }

  return {
    user,
    profile,
  };
}
