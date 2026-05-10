import "server-only";

import type { ProfilePublicRow } from "@/lib/database.types";
import { PROFILES_PUBLIC_SELECT_COLUMNS } from "@/lib/database.types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Safe public fields from `profiles_public` (no email/role). */
export type ProfilePublicSummary = {
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  author_header_image: string | null;
};

/**
 * Loads usernames and avatar URLs from `profiles_public` only (no email/role).
 * Prefers the service role when configured so anonymous page renders still resolve
 * author/comment data without depending on anon JWT + view grants alone.
 */
export async function fetchPublicProfilesByIds(
  ids: string[],
): Promise<Map<string, ProfilePublicSummary>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, ProfilePublicSummary>();
  if (!unique.length) return map;

  const rowToSummary = (row: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    author_header_image: string | null;
  }) => {
    map.set(row.id, {
      username: row.username ?? null,
      avatar_url: row.avatar_url ?? null,
      bio: row.bio ?? null,
      author_header_image: row.author_header_image ?? null,
    });
  };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    try {
      const supabase = createSupabaseServiceRoleClient();
      const { data, error } = await supabase
        .from("profiles_public")
        .select(PROFILES_PUBLIC_SELECT_COLUMNS)
        .in("id", unique);
      if (error) {
        console.error("[profiles_public] service batch", error.message);
      } else {
        (data ?? []).forEach(rowToSummary);
        return map;
      }
    } catch (e) {
      console.error("[profiles_public] service batch failed", e);
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles_public")
    .select(PROFILES_PUBLIC_SELECT_COLUMNS)
    .in("id", unique);

  if (error) {
    console.error("[profiles_public] session batch", error.message);
    return map;
  }
  (data ?? []).forEach(rowToSummary);
  return map;
}

/** @deprecated Prefer `fetchPublicProfilesByIds` when you need avatars. */
export async function fetchPublicDisplayUsernamesByIds(
  ids: string[],
): Promise<Map<string, string | null>> {
  const full = await fetchPublicProfilesByIds(ids);
  const map = new Map<string, string | null>();
  full.forEach((v, k) => map.set(k, v.username));
  return map;
}

/** Single-row lookup for `/authors/[username]` (only `profiles_public` columns). */
export async function fetchPublicProfileByUsername(
  username: string,
): Promise<ProfilePublicRow | null> {
  const term = username.trim();
  if (!term) return null;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceKey) {
    try {
      const supabase = createSupabaseServiceRoleClient();
      const { data, error } = await supabase
        .from("profiles_public")
        .select(PROFILES_PUBLIC_SELECT_COLUMNS)
        .ilike("username", term)
        .maybeSingle();
      if (!error && data) {
        return data as ProfilePublicRow;
      }
      if (error) {
        console.error("[profiles_public] service by username", error.message);
      }
    } catch (e) {
      console.error("[profiles_public] service by username failed", e);
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles_public")
    .select(PROFILES_PUBLIC_SELECT_COLUMNS)
    .ilike("username", term)
    .maybeSingle();

  if (error) {
    console.error("[profiles_public] session by username", error.message);
    return null;
  }
  return (data as ProfilePublicRow | null) ?? null;
}
