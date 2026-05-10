"use server";

import {
  COMMENT_BODY_MAX_CHARS,
  COMMENT_RATE_LIMIT_MAX,
  COMMENT_RATE_LIMIT_WINDOW_MS,
} from "@/lib/comments/constants";
import { getSessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CommentActionState = {
  ok: boolean;
  error: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseOptionalParentId(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!UUID_RE.test(t)) return null;
  return t;
}

function parseRequiredCommentId(raw: string): string | null {
  const t = raw.trim();
  if (!UUID_RE.test(t)) return null;
  return t;
}

function parseRequiredPostId(raw: string): string | null {
  const t = raw.trim();
  if (!UUID_RE.test(t)) return null;
  return t;
}

/** Post-order: children first, then root — safe when FK forbids deleting a parent while replies exist. */
function subtreeIdsPostOrder(
  rows: { id: string; parent_comment_id: string | null }[],
  rootId: string,
): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const r of rows) {
    const pid = r.parent_comment_id;
    if (!pid) continue;
    if (!childrenByParent.has(pid)) childrenByParent.set(pid, []);
    childrenByParent.get(pid)!.push(r.id);
  }
  const out: string[] = [];
  function dfs(id: string) {
    for (const child of childrenByParent.get(id) ?? []) dfs(child);
    out.push(id);
  }
  dfs(rootId);
  return out;
}

export async function deleteCommentAction(
  postSlug: string,
  _prev: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const session = await getSessionUser();
  if (!session?.user) {
    return { ok: false, error: "You must be logged in to delete a comment." };
  }

  const commentId = parseRequiredCommentId(String(formData.get("comment_id") ?? ""));
  const postId = parseRequiredPostId(String(formData.get("post_id") ?? ""));
  if (!commentId || !postId) {
    return { ok: false, error: "Invalid delete request." };
  }

  const supabase = await createSupabaseServerClient();
  const userIsAdmin = isAdmin(session.profile);

  const { data: target, error: targetErr } = await supabase
    .from("comments")
    .select("id, user_id, post_id")
    .eq("id", commentId)
    .maybeSingle();

  if (targetErr) {
    console.error("[comment delete] load target", targetErr.message);
    return { ok: false, error: "Could not load comment." };
  }
  if (!target || target.post_id !== postId) {
    return { ok: false, error: "Comment not found for this article." };
  }

  if (!userIsAdmin && target.user_id !== session.user.id) {
    return { ok: false, error: "You can only delete your own comments." };
  }

  const { data: allRows, error: allErr } = await supabase
    .from("comments")
    .select("id, user_id, parent_comment_id")
    .eq("post_id", postId);

  if (allErr || !allRows) {
    console.error("[comment delete] load thread", allErr?.message);
    return { ok: false, error: "Could not load comments for this article." };
  }

  const idsToDelete = subtreeIdsPostOrder(allRows, commentId);
  if (!idsToDelete.length) {
    return { ok: false, error: "Comment not found." };
  }

  if (!userIsAdmin) {
    for (const id of idsToDelete) {
      const row = allRows.find((r) => r.id === id);
      if (row && row.user_id !== session.user.id) {
        return {
          ok: false,
          error:
            "This comment has replies from other people. Ask a moderator to remove the thread, or delete replies you own first.",
        };
      }
    }
  }

  for (const id of idsToDelete) {
    const { error: delErr } = await supabase.from("comments").delete().eq("id", id);
    if (delErr) {
      console.error("[comment delete]", id, delErr.message);
      return { ok: false, error: delErr.message };
    }
  }

  revalidatePath(`/articles/${postSlug}`);
  return { ok: true, error: null };
}

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
  const parentRaw = String(formData.get("parent_comment_id") ?? "");
  const parentCommentId = parseOptionalParentId(parentRaw);

  if (!postId) return { ok: false, error: "Missing post." };
  if (!body) return { ok: false, error: "Comment cannot be empty." };
  if (body.length > COMMENT_BODY_MAX_CHARS) {
    return { ok: false, error: "Comment must be 250 characters or less." };
  }
  if (parentRaw.trim() && !parentCommentId) {
    return { ok: false, error: "Invalid reply target." };
  }

  const supabase = await createSupabaseServerClient();

  const windowStart = new Date(
    Date.now() - COMMENT_RATE_LIMIT_WINDOW_MS,
  ).toISOString();
  const { count: recentCount, error: rateErr } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .gte("created_at", windowStart);

  if (rateErr) {
    console.error("[comment rate limit]", rateErr.message);
    return { ok: false, error: "Could not verify rate limit. Try again." };
  }
  if ((recentCount ?? 0) >= COMMENT_RATE_LIMIT_MAX) {
    return {
      ok: false,
      error: "You're commenting too fast. Please wait a moment.",
    };
  }

  if (parentCommentId) {
    const { data: parentRow, error: parentErr } = await supabase
      .from("comments")
      .select("id")
      .eq("id", parentCommentId)
      .eq("post_id", postId)
      .maybeSingle();

    if (parentErr) {
      console.error("[comment parent lookup]", parentErr.message);
      return { ok: false, error: "Could not verify reply target." };
    }
    if (!parentRow) {
      return { ok: false, error: "Invalid reply target." };
    }
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: session.user.id,
    body,
    parent_comment_id: parentCommentId,
  });

  if (error) {
    console.error("[comment insert]", error.message, error);
    if (error.code === "23514") {
      return { ok: false, error: "Comment must be 250 characters or less." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath(`/articles/${postSlug}`);
  return { ok: true, error: null };
}
