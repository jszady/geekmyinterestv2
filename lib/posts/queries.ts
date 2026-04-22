import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  PROFILES_SELECT_COLUMNS,
  type PostRow,
  type ProfileRow,
} from "@/lib/database.types";

export async function fetchPublishedPostBySlug(
  slug: string,
): Promise<PostRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[posts] by slug", error.message);
    return null;
  }
  return data as PostRow | null;
}

export async function fetchPostByIdForAdmin(
  id: string,
): Promise<PostRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[posts] admin by id", error.message);
    return null;
  }
  return data as PostRow | null;
}

export async function fetchAllPostsForAdmin(): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[posts] admin list", error.message);
    return [];
  }
  return (data ?? []) as PostRow[];
}

export async function fetchPublishedPostsLatest(): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[posts] latest", error.message);
    return [];
  }
  return (data ?? []) as PostRow[];
}

export async function fetchPublishedPostsWithSlots(): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .not("homepage_slot", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[posts] slotted", error.message);
    return [];
  }
  return (data ?? []) as PostRow[];
}

export async function fetchProfilesByIds(
  ids: string[],
): Promise<Map<string, { username: string | null }>> {
  const map = new Map<string, { username: string | null }>();
  if (!ids.length) return map;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILES_SELECT_COLUMNS)
    .in("id", ids);

  if (error) {
    console.error("[profiles] batch", error.message);
    return map;
  }
  (data ?? []).forEach((row: { id: string; username: string | null }) => {
    map.set(row.id, { username: row.username });
  });
  return map;
}

export async function fetchPublishedPostsByAuthorId(
  authorId: string,
): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", authorId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[posts] by author", error.message);
    return [];
  }
  return (data ?? []) as PostRow[];
}

export async function fetchProfileByUsername(
  username: string,
): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILES_SELECT_COLUMNS)
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    console.error("[profiles] by username", error.message);
    return null;
  }
  return data as ProfileRow | null;
}
