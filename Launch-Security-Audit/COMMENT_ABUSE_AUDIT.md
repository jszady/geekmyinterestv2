# Comment System Abuse Audit

---

## Architecture

Single server action: `addCommentAction` in `app/articles/comment-actions.ts`  
UI: `components/articles/ArticleComments.tsx` (client component)  
Constants: `lib/comments/constants.ts`

---

## Authentication Check

```typescript
const session = await getSessionUser();
if (!session?.user) {
  return { ok: false, error: "You must be logged in to comment." };
}
```

Uses `getSessionUser()` which calls `supabase.auth.getUser()` server-side. Cannot be faked. SOLID.

---

## Input Validation

### `body` — FULLY VALIDATED

```typescript
if (!body) return { ok: false, error: "Comment cannot be empty." };
if (body.length > COMMENT_BODY_MAX_CHARS) {   // COMMENT_BODY_MAX_CHARS = 250
  return { ok: false, error: "Comment must be 250 characters or less." };
}
```

DB constraint also enforces it:
```sql
-- 008_comments_body_max_length.sql
check (char_length(body) <= 250)
```

On DB constraint violation, error code `23514` is caught and returns a user-friendly message. Two-layer defense. SOLID.

### Rate limiting — IMPLEMENTED

```typescript
const windowStart = new Date(Date.now() - COMMENT_RATE_LIMIT_WINDOW_MS).toISOString();
// COMMENT_RATE_LIMIT_WINDOW_MS = 60_000 (1 minute)
// COMMENT_RATE_LIMIT_MAX = 5
const { count: recentCount } = await supabase
  .from("comments")
  .select("id", { count: "exact", head: true })
  .eq("user_id", session.user.id)
  .gte("created_at", windowStart);

if ((recentCount ?? 0) >= COMMENT_RATE_LIMIT_MAX) {
  return { ok: false, error: "You're commenting too fast. Please wait a moment." };
}
```

5 comments per minute per user. This runs a DB query before every comment submission, adding 1 round trip. Acceptable.

**Gap:** If `rateErr` from the count query is non-null, the action returns an error: `"Could not verify rate limit. Try again."`. This means a DB error (connection spike, timeout) causes all comments to fail until the DB recovers. That's the safe failure mode.

**Gap:** Rate limit is per `user_id`, not per IP. A user with multiple accounts (sockpuppet accounts) can bypass it. At 5 comments/min per account, this is a low-risk abuse vector for a launch-stage site.

### `parent_comment_id` — VALIDATED

```typescript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseOptionalParentId(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!UUID_RE.test(t)) return null;
  return t;
}
```

If provided, the parent is then verified to exist AND belong to the same post:
```typescript
const { data: parentRow } = await supabase
  .from("comments")
  .select("id")
  .eq("id", parentCommentId)
  .eq("post_id", postId)   // same post required
  .maybeSingle();

if (!parentRow) return { ok: false, error: "Invalid reply target." };
```

SOLID. Cross-post reply injection is impossible.

### `post_id` — PARTIALLY VALIDATED

```typescript
const postId = String(formData.get("post_id") ?? "").trim();
if (!postId) return { ok: false, error: "Missing post." };
// No UUID format check here
// No published-post verification here
```

`parent_comment_id` gets UUID regex validation; `post_id` does not. Any non-empty string passes. The RLS `WITH CHECK` for `comments_insert_authenticated` does enforce:
```sql
and exists (select 1 from public.posts po where po.id = comments.post_id and po.status = 'published')
```

So the DB will reject a comment on a non-published post, but the error returned to the user will be the raw Supabase RLS violation, not a clean message.

**Not a blocker** (RLS protects it) but worth a UUID format check for cleaner error handling.

---

## XSS Analysis

Comment body is rendered:
```tsx
<p className="... text-zinc-200">
  {node.body}
</p>
```

Standard React JSX rendering. HTML entities are escaped. A comment containing `<script>alert(1)</script>` renders as literal text. No `dangerouslySetInnerHTML` anywhere in the comment rendering path.

**XSS via comments: NOT POSSIBLE through normal rendering.**

---

## `user_id` Assignment

```typescript
const { error } = await supabase.from("comments").insert({
  post_id: postId,
  user_id: session.user.id,   // from server-side session, NOT from formData
  body,
  parent_comment_id: parentCommentId,
});
```

`user_id` comes from the server-validated session, never from form input. A user cannot comment as another user.

**RLS also enforces this** at the DB level: `WITH CHECK (user_id = auth.uid())`. Even a direct REST API call with a spoofed `user_id` in the payload would be rejected by the DB. Double protected.

---

## Can Comments Attach to Unpublished Posts?

**No.** The RLS policy `comments_insert_authenticated` enforces:
```sql
and exists (select 1 from public.posts po where po.id = comments.post_id and po.status = 'published')
```

A comment targeting a draft post will fail at the DB level regardless of what the application does.

---

## Comment Moderation

**No comment deletion exists in the application UI.** There is no `deleteCommentAction` server action. The RLS policy `comments_delete_own_or_admin` is in place, meaning:

- Users CAN delete their own comments via direct Supabase REST API (the RLS allows it)
- But there is no UI or server action to do so

**For launch:** If someone posts spam or harassment, the admin must delete comments directly from the Supabase Table Editor dashboard. This is workable at launch-scale traffic but will become painful as comment volume grows.

**Recommended post-launch task:** Implement `deleteCommentAction` (admin) and optionally `deleteOwnCommentAction` (any user, own comments only).

---

## Spam Vectors

| Vector | Risk | Status |
|--------|------|--------|
| Flood comments (same user) | LOW | 5/min rate limit in place |
| Large comment body (DB fill) | LOW | 250 char limit + DB constraint |
| Comments as another user | NONE | user_id from session; RLS enforces |
| Comments on draft posts | NONE | RLS blocks |
| XSS via comment body | NONE | React escaping |
| Reply bomb (flood replies to one comment) | LOW | Counted in same rate limit |
| Sockpuppet accounts | LOW | Would require separate accounts; acceptable at launch |
| Comment on any post_id (cross-post injection) | LOW | RLS blocks unpublished; app validation missing UUID check |

---

## Summary

The comment system is well-protected for launch. The 250-char cap and 5/min rate limit are both implemented at app and DB levels. The one gap worth fixing before launch is adding a UUID check on `post_id` for cleaner error messages when invalid IDs are submitted. Everything else is either solid or acceptable risk.
