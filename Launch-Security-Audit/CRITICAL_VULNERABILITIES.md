# Critical Vulnerabilities

Fresh audit against the current codebase. Previous fixes (open redirect, upload validation, comment limits, RLS migrations, role trigger) are confirmed working. New issues below.

---

## VULN-1 — `profiles_select_public` Exposes All User Emails to Anonymous Requests

**Severity:** HIGH  
**File:** `supabase/migrations/001_rls_profiles.sql` lines 8–13  
**Must fix before launch:** YES

```sql
create policy "profiles_select_public"
  on public.profiles
  for select
  to anon, authenticated
  using (true);
```

`to anon` means unauthenticated HTTP requests through the Supabase REST API can read every row in `profiles`, including the `email` column.

Any attacker with the anon key (which is public by design) can run:
```bash
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://xxxx.supabase.co/rest/v1/profiles?select=id,email,username"
```

And receive a complete dump of every registered user's email address and username.

**Why it matters:** This is a full email list exfiltration with zero authentication required. The anon key is embedded in the client-side bundle and visible to anyone who opens DevTools. One request, all emails.

**Fix:** Split the policy. Grant public reads for display fields only; restrict email to the owning user:

```sql
-- Drop the current overly-broad policy
drop policy if exists "profiles_select_public" on public.profiles;

-- Public: anyone can read display fields (username, id, created_at)
create policy "profiles_select_public_display"
  on public.profiles
  for select
  to anon, authenticated
  using (true);
```

But you cannot restrict columns in a Supabase policy. The real fix is to use a **view**:

```sql
-- Expose only safe columns publicly
create or replace view public.profiles_public as
  select id, username, created_at from public.profiles;

-- Grant select on the view, revoke on the base table for anon
grant select on public.profiles_public to anon, authenticated;
revoke select on public.profiles to anon;
-- Authenticated users can still read their own full row:
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());
-- Admins can read all:
create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(trim(coalesce(p.role::text, ''))) = 'admin'
  ));
```

**Important:** Application code that joins `profiles` for comment author names and author pages must switch to `profiles_public` or the join must happen server-side via service role.

---

## VULN-2 — `signUpAction` Has Unguarded `console.log` That Leaks User Data in Production

**Severity:** MEDIUM  
**File:** `app/auth/actions.ts` lines 47–52 and 94–99  
**Must fix before launch:** YES (privacy/data hygiene)

```typescript
// Line 47 — NOT inside NODE_ENV guard
console.log("[signup] username availability check:", {
  submittedUsername,
  normalizedUsername: username,
  rows: takenUsernameRows ?? [],   // contains profile id + username of existing user
  error: usernameCheckError ?? null,
});

// Line 94 — NOT inside NODE_ENV guard
console.log("[signup] supabase signUp response:", {
  hasUser: Boolean(data.user),
  hasSession: Boolean(data.session),
  identitiesCount: data.user?.identities?.length ?? 0,
  error,
});
```

Compare to lines 191–193 which ARE correctly guarded:
```typescript
if (process.env.NODE_ENV === "development") {
  console.log("[complete-profile] submitted username:", submitted);
```

In production on Vercel, every signup attempt will write the checked username and any matching existing profile data to server logs. Vercel logs are retained for a period and accessible to anyone with project access.

**Fix:** Wrap both unguarded `console.log` calls with `NODE_ENV` guards:
```typescript
if (process.env.NODE_ENV === "development") {
  console.log("[signup] username availability check:", { ... });
}
// ...
if (process.env.NODE_ENV === "development") {
  console.log("[signup] supabase signUp response:", { ... });
}
```

---

## VULN-3 — No Server-Side Minimum Password Length in `signUpAction`

**Severity:** MEDIUM  
**File:** `app/auth/actions.ts` lines 19–29  
**Must fix before launch:** RECOMMENDED

The signup action checks that `password` is non-empty:
```typescript
if (!email || !password || !username) {
  return { ok: false, error: "Email, password, and username are required." };
}
```

No minimum length check. A direct POST to the server action (bypassing the HTML form's `minLength` attribute) can create an account with a 1-character password. Supabase's default minimum is 6 characters, but that's configurable and easy to miss.

**Fix:**
```typescript
if (password.length < 8) {
  return { ok: false, error: "Password must be at least 8 characters.", reason: "validation" };
}
```

---

## VULN-4 — Contact Form Has No Rate Limiting

**Severity:** HIGH  
**File:** `app/contact/actions.ts`  
**Must fix before launch:** YES

`submitContactForm` has field-length validation but zero rate limiting. A script can POST to this action indefinitely:

```bash
while true; do
  curl -X POST /contact -d "name=A&email=a@b.com&message=spam..."
done
```

**Impact:**
- If `RESEND_API_KEY` is configured: Each successful submission sends an email via Resend. Resend free tier is 100 emails/day, paid plans charge per email. A bot can exhaust the daily quota in seconds, or rack up a significant bill on paid plans.
- The server action has no auth requirement — any visitor, including bots, can trigger it.
- The admin inbox gets flooded with garbage.

**Fix:** Add an IP-based or session-based rate limit. Simplest approach without external dependencies — check a "last contact submission" timestamp in a cookie or use a Supabase table:

```typescript
// Minimum viable: check a signed timestamp in a cookie
// Or use Vercel KV / Upstash for per-IP rate limiting
```

At minimum, add a honeypot field (hidden input that bots fill in but humans don't) as a spam filter:
```typescript
const honeypot = String(formData.get("_hp") ?? "");
if (honeypot) return { ok: false, error: "Spam detected." };
```

---

## VULN-5 — `post_id` in Comment Action Is Not Validated Server-Side

**Severity:** LOW (mitigated by RLS, but app layer has no defense)  
**File:** `app/articles/comment-actions.ts` lines 37, 42  
**Must fix before launch:** NO, but recommended

```typescript
const postId = String(formData.get("post_id") ?? "").trim();
if (!postId) return { ok: false, error: "Missing post." };
// No UUID format check, no published post verification
```

`parent_comment_id` is validated with a UUID regex. `post_id` is not — any string passes the non-empty check and goes directly into the Supabase query.

The RLS policy `comments_insert_authenticated` does enforce:
```sql
and exists (select 1 from public.posts po where po.id = comments.post_id and po.status = 'published')
```

So comments cannot be attached to unpublished posts through the DB layer. But there is no application-layer feedback — the DB rejects invalid `post_id` values with an RLS violation error which surfaces to the user as the raw Supabase error message.

**Fix:**
```typescript
// Add UUID format check (same pattern as parent_comment_id)
if (!UUID_RE.test(postId)) {
  return { ok: false, error: "Invalid post." };
}
// Optional: verify published status server-side for better error message
const { data: postRow } = await supabase
  .from("posts").select("id").eq("id", postId).eq("status", "published").maybeSingle();
if (!postRow) return { ok: false, error: "Post not found." };
```

---

## VULN-6 — `/api/search` Has No Rate Limiting

**Severity:** MEDIUM  
**File:** `app/api/search/route.ts`  
**Must fix before launch:** RECOMMENDED

Public unauthenticated GET endpoint. Each request triggers up to 5 parallel Supabase queries (title ILIKE, excerpt ILIKE, tags name ILIKE, tags slug ILIKE, post_tags lookup). Query is capped to 120 chars. No per-IP request throttle.

A bot running 100 req/s would trigger 500 Supabase queries/second. On a Supabase free tier (shared database), this could cause connection pool exhaustion and slow down all other queries.

**Fix:** Add response caching for identical queries, or implement per-IP rate limiting in middleware. Minimum viable:
```typescript
// In next.config.ts or middleware, cache GET /api/search responses for 30s:
// export const revalidate = 30; // in Route Handler
```

Or add a short revalidation period:
```typescript
return NextResponse.json({ ok: true, results }, {
  headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
});
```

---

## CONFIRMED FIXED — Issues from Previous Audit

| Issue | Status | Evidence |
|-------|--------|----------|
| Open redirect in OAuth callback | FIXED | `lib/auth/safe-redirect.ts` + used in `app/auth/callback/route.ts` line 13 |
| No file type validation on uploads | FIXED | `lib/storage/validate-admin-image-upload.ts` — MIME + extension + blocked list + 5MB |
| No comment body length limit | FIXED | `COMMENT_BODY_MAX_CHARS = 250` in constants, enforced in action + DB constraint |
| No comment rate limiting | FIXED | 5 per 60s window checked in `addCommentAction` |
| RLS missing on core tables | FIXED | `supabase/migrations/001–008` cover profiles, posts, comments, podcast_episodes, tags, storage |
| Role escalation via profiles UPDATE | FIXED | `007_security_triggers.sql` — trigger blocks role changes by non-admins |
| Storage bucket INSERT unrestricted | FIXED | `006_rls_storage.sql` — admin-only INSERT on both buckets |
| Service role key client-exposed | NOT AN ISSUE | `lib/supabase/admin.ts` has no `"use client"` — server-only |
| XSS via comment body | NOT AN ISSUE | React escapes all `{variable}` rendering — no `dangerouslySetInnerHTML` on user content |
