import type { PostRow } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { escapeIlikePattern } from "@/lib/text/ilike-escape";

const MIN_QUERY_LEN = 2;
const MAX_QUERY_LEN = 120;

/**
 * Published posts matching title, excerpt (ILIKE), or linked tags (name/slug ILIKE).
 * Merges and dedupes by post id, newest first.
 */
export async function searchPublishedPostRows(
  term: string,
  limit: number,
): Promise<PostRow[]> {
  const raw = term.trim();
  if (raw.length < MIN_QUERY_LEN || raw.length > MAX_QUERY_LEN) return [];

  const cap = Math.min(Math.max(limit, 1), 100);
  const pattern = `%${escapeIlikePattern(raw)}%`;
  const supabase = await createSupabaseServerClient();

  const [titleRes, excerptRes, tagsNameRes, tagsSlugRes] = await Promise.all([
    supabase.from("posts").select("*").eq("status", "published").ilike("title", pattern),
    supabase.from("posts").select("*").eq("status", "published").ilike("excerpt", pattern),
    supabase.from("tags").select("id").ilike("name", pattern),
    supabase.from("tags").select("id").ilike("slug", pattern),
  ]);

  if (titleRes.error) console.error("[search] title", titleRes.error.message);
  if (excerptRes.error) console.error("[search] excerpt", excerptRes.error.message);
  if (tagsNameRes.error) console.error("[search] tags name", tagsNameRes.error.message);
  if (tagsSlugRes.error) console.error("[search] tags slug", tagsSlugRes.error.message);

  const map = new Map<string, PostRow>();
  for (const row of titleRes.data ?? []) {
    map.set(row.id, row as PostRow);
  }
  for (const row of excerptRes.data ?? []) {
    map.set(row.id, row as PostRow);
  }

  const tagIdSet = new Set<string>();
  for (const t of tagsNameRes.data ?? []) tagIdSet.add((t as { id: string }).id);
  for (const t of tagsSlugRes.data ?? []) tagIdSet.add((t as { id: string }).id);
  const tagIds = [...tagIdSet];

  if (tagIds.length) {
    const { data: links, error: linkErr } = await supabase
      .from("post_tags")
      .select("post_id")
      .in("tag_id", tagIds);
    if (linkErr) {
      console.error("[search] post_tags", linkErr.message);
    } else {
      const postIds = [...new Set((links ?? []).map((l: { post_id: string }) => l.post_id))];
      if (postIds.length) {
        const { data: tagPosts, error: tpErr } = await supabase
          .from("posts")
          .select("*")
          .in("id", postIds)
          .eq("status", "published");
        if (tpErr) console.error("[search] posts by tag", tpErr.message);
        for (const row of tagPosts ?? []) {
          map.set(row.id, row as PostRow);
        }
      }
    }
  }

  const sorted = [...map.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return sorted.slice(0, cap);
}
