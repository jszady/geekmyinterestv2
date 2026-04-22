import { PROFILES_SELECT_COLUMNS } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CommentWithAuthor = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  username: string | null;
};

export async function fetchCommentsForPost(
  postId: string,
): Promise<CommentWithAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("comments")
    .select("id, body, created_at, user_id")
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
      username: null,
    }));
  }

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select(PROFILES_SELECT_COLUMNS)
    .in("id", ids);

  if (pErr) {
    console.error("[comments] profiles", pErr.message);
  }

  const nameById = new Map<string, string | null>();
  (profiles ?? []).forEach((p: { id: string; username: string | null }) => {
    nameById.set(p.id, p.username);
  });

  return comments.map((c) => ({
    ...c,
    username: nameById.get(c.user_id) ?? null,
  }));
}
