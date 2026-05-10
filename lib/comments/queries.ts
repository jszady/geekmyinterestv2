import "server-only";

import type { CommentWithAuthor } from "@/lib/comments/comment-thread";
import { fetchPublicProfilesByIds } from "@/lib/profiles/fetch-public-usernames";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type { CommentWithAuthor } from "@/lib/comments/comment-thread";

export async function fetchCommentsForPost(
  postId: string,
): Promise<CommentWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("comments")
    .select("id, body, created_at, user_id, parent_comment_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[comments] list", error.message, error);
    return [];
  }

  const comments = rows ?? [];
  const ids = [...new Set(comments.map((c) => c.user_id))];
  if (!ids.length) {
    return comments.map((c) => ({
      ...c,
      parent_comment_id: c.parent_comment_id ?? null,
      username: null,
      avatar_url: null,
    }));
  }

  const profileById = await fetchPublicProfilesByIds(ids);

  return comments.map((c) => {
    const p = profileById.get(c.user_id);
    return {
      ...c,
      parent_comment_id: c.parent_comment_id ?? null,
      username: p?.username ?? null,
      avatar_url: p?.avatar_url ?? null,
    };
  });
}
