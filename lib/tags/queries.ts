import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PostRow, TagRow } from "@/lib/database.types";

export async function fetchTagsForPostId(postId: string): Promise<TagRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: links, error: linkErr } = await supabase
    .from("post_tags")
    .select("tag_id")
    .eq("post_id", postId);

  if (linkErr) {
    console.error("[post_tags] for post", linkErr.message);
    return [];
  }
  const ids = [...new Set((links ?? []).map((r: { tag_id: string }) => r.tag_id))];
  if (!ids.length) return [];

  const { data: tags, error: tagErr } = await supabase
    .from("tags")
    .select("id, name, slug, created_at")
    .in("id", ids);

  if (tagErr) {
    console.error("[tags] batch for post", tagErr.message);
    return [];
  }
  const out = (tags ?? []) as TagRow[];
  out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return out;
}

export async function fetchTagSlugsForPostId(postId: string): Promise<string[]> {
  const tags = await fetchTagsForPostId(postId);
  return tags.map((t) => t.slug);
}

export async function fetchTagSlugsByIds(tagIds: string[]): Promise<string[]> {
  const unique = [...new Set(tagIds.filter(Boolean))];
  if (!unique.length) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("tags").select("slug").in("id", unique);
  if (error) {
    console.error("[tags] slugs by ids", error.message);
    return [];
  }
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function fetchTagBySlug(slug: string): Promise<TagRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[tags] by slug", error.message);
    return null;
  }
  return data as TagRow | null;
}

export async function fetchPublishedPostsByTagSlug(
  tagSlug: string,
): Promise<PostRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: tag, error: tErr } = await supabase
    .from("tags")
    .select("id")
    .eq("slug", tagSlug)
    .maybeSingle();
  if (tErr || !tag) {
    if (tErr) console.error("[tags] resolve for listing", tErr.message);
    return [];
  }

  const { data: links, error: lErr } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tag.id);
  if (lErr || !links?.length) {
    if (lErr) console.error("[post_tags] for tag", lErr.message);
    return [];
  }

  const postIds = [...new Set(links.map((r: { post_id: string }) => r.post_id))];
  const { data: posts, error: pErr } = await supabase
    .from("posts")
    .select("*")
    .in("id", postIds)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (pErr) {
    console.error("[posts] by tag", pErr.message);
    return [];
  }
  return (posts ?? []) as PostRow[];
}
