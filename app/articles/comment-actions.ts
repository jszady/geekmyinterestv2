"use server";

import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CommentActionState = {
  ok: boolean;
  error: string | null;
};

export async function addCommentAction(
  postSlug: string,
  _prev: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const session = await getSessionUser();
  if (!session?.user) {
    return { ok: false, error: "You must be logged in to comment." };
  }

  const postId = String(formData.get("post_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!postId) return { ok: false, error: "Missing post." };
  if (!body) return { ok: false, error: "Comment cannot be empty." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: session.user.id,
    body,
  });

  if (error) {
    console.error("[comment insert]", error.message, error);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/articles/${postSlug}`);
  return { ok: true, error: null };
}
