/**
 * Client-safe comment thread types and grouping (no Supabase / next/headers).
 */

export type CommentWithAuthor = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  parent_comment_id: string | null;
};

export type CommentThreadNode = CommentWithAuthor & {
  replies: CommentThreadNode[];
};

/**
 * Groups flat comments into a tree (top-level only in the root array; each node has `replies`).
 * Orphaned rows (missing parent in this set) are treated as roots so nothing is dropped.
 */
export function buildCommentThreads(comments: CommentWithAuthor[]): CommentThreadNode[] {
  const byId = new Map<string, CommentThreadNode>();
  for (const c of comments) {
    byId.set(c.id, { ...c, replies: [] });
  }
  const roots: CommentThreadNode[] = [];
  for (const c of comments) {
    const node = byId.get(c.id)!;
    const pid = c.parent_comment_id;
    if (pid && byId.has(pid)) {
      byId.get(pid)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortByTime = (nodes: CommentThreadNode[]) => {
    nodes.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    for (const n of nodes) sortByTime(n.replies);
  };
  sortByTime(roots);
  return roots;
}
