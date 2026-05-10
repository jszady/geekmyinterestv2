import {
  fetchPublicProfileByUsername,
  fetchPublicProfilesByIds,
} from "@/lib/profiles/fetch-public-usernames";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type PostCategoryDb,
  type PostRow,
  type ProfilePublicRow,
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
): Promise<Map<string, { username: string | null; avatar_url: string | null }>> {
  return fetchPublicProfilesByIds(ids);
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

export async function fetchPublishedPostsByCategory(
  category: string,
  limit = 60,
): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[posts] by category", error.message);
    return [];
  }
  return (data ?? []) as PostRow[];
}

export async function fetchRelatedPosts(
  postId: string,
  tagIds: string[],
  category: string,
  limit = 3,
): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();

  if (tagIds.length) {
    const { data: links } = await supabase
      .from("post_tags")
      .select("post_id")
      .in("tag_id", tagIds)
      .neq("post_id", postId);

    const candidateIds = [...new Set((links ?? []).map((r: { post_id: string }) => r.post_id))];

    if (candidateIds.length) {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .in("id", candidateIds)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(limit);

      if ((data ?? []).length >= limit) return (data ?? []) as PostRow[];

      if ((data ?? []).length > 0) {
        const found = (data ?? []) as PostRow[];
        const foundIds = found.map((p) => p.id);
        const remaining = limit - found.length;
        const { data: extra } = await supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .eq("category", category)
          .neq("id", postId)
          .not("id", "in", `(${foundIds.join(",")})`)
          .order("created_at", { ascending: false })
          .limit(remaining);
        return [...found, ...((extra ?? []) as PostRow[])];
      }
    }
  }

  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("category", category)
    .neq("id", postId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as PostRow[];
}

export async function fetchPublishedPostsCount(
  category: PostCategoryDb | null,
): Promise<number> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  if (category) q = q.eq("category", category);
  const { count, error } = await q;
  if (error) {
    console.error("[posts] published count", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function fetchPublishedPostsPage(
  page: number,
  perPage: number,
  category: PostCategoryDb | null,
): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  let q = supabase.from("posts").select("*").eq("status", "published");
  if (category) q = q.eq("category", category);
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("[posts] published page", error.message);
    return [];
  }
  return (data ?? []) as PostRow[];
}

export async function fetchProfileByUsername(
  username: string,
): Promise<ProfilePublicRow | null> {
  return fetchPublicProfileByUsername(username);
}
