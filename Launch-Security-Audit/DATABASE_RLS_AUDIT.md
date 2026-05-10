# Database RLS Audit

All migrations are in `supabase/migrations/`. This audit reads the actual SQL — no guessing.

---

## Migration Inventory

| File | Table(s) | Status |
|------|---------|--------|
| `001_rls_profiles.sql` | `profiles` | Applied if run |
| `002_rls_posts.sql` | `posts` | Applied if run |
| `003_rls_comments.sql` | `comments` | Applied if run |
| `004_rls_podcast_episodes.sql` | `podcast_episodes` | Applied if run |
| `005_rls_tags.sql` | `tags`, `post_tags` | Applied if run |
| `006_rls_storage.sql` | `storage.objects` | Applied if run |
| `007_security_triggers.sql` | `profiles` (trigger) | Applied if run |
| `008_comments_body_max_length.sql` | `comments` (constraint) | Applied if run |

**CRITICAL:** These are SQL files in source control. They do not run automatically. If you have not manually applied them in the Supabase dashboard, none of these policies exist in production. See LAUNCH_BLOCKERS.md.

---

## `profiles` Table — `001_rls_profiles.sql`

**RLS enabled:** YES (via `alter table public.profiles enable row level security`)

| Policy | Operation | Who | Condition |
|--------|-----------|-----|-----------|
| `profiles_select_public` | SELECT | anon + authenticated | `using (true)` |
| `profiles_insert_own` | INSERT | authenticated | `id = auth.uid()` |
| `profiles_update_own_or_admin` | UPDATE | authenticated | `id = auth.uid()` OR actor is admin |

**Issues:**

**1. SELECT exposes emails to anonymous requests** (see CRITICAL_VULNERABILITIES.md VULN-1)
The `to anon` + `using (true)` combination lets any unauthenticated client read the entire `profiles` table including `email` via the REST API. The anon key is public. This is not acceptable for a user email field.

**2. No DELETE policy**
Users cannot delete their own profile. That's intentional per the comment in the migration (`-- No broad DELETE for users`). Acceptable at launch.

**3. UPDATE policy is admin-gated via inline subquery**
The `profiles_update_own_or_admin` policy subqueries `public.profiles` to check if the actor is admin. This creates a recursive read — the policy reads `profiles` to evaluate if an update to `profiles` is allowed. This can cause issues if RLS recursion protection is not in place. Supabase handles this with `SECURITY DEFINER` contexts but it's worth verifying this doesn't cause infinite loops in edge cases.

**4. Role column restriction impossible at RLS level**
RLS cannot restrict which columns are in an UPDATE. The trigger in `007` blocks role changes by non-admins, which is the correct defense. This IS implemented. However, the trigger uses `auth.uid()` inside a `SECURITY DEFINER` function. In the Supabase context, `auth.uid()` should be available in triggers during RLS-evaluated writes. If for any reason `auth.uid()` returns NULL in the trigger context, `actor_is_admin` would be false, and any role change attempt would be blocked — which is the safe failure direction.

---

## `posts` Table — `002_rls_posts.sql`

**RLS enabled:** YES

| Policy | Operation | Who | Condition |
|--------|-----------|-----|-----------|
| `posts_select_published_or_admin` | SELECT | anon + authenticated | `status = 'published'` OR actor is admin |
| `posts_insert_admin` | INSERT | authenticated | `author_id = auth.uid()` AND actor is admin |
| `posts_update_admin` | UPDATE | authenticated | actor is admin |
| `posts_delete_admin` | DELETE | authenticated | actor is admin |

**Assessment: SOLID.** Anon and regular users cannot read draft posts. Insert requires both admin role AND that `author_id` matches the session user — prevents an admin from creating posts attributed to other users. Update/delete are admin-only with no additional constraint, which is correct.

**One note on the admin post queries:**
`fetchAllPostsForAdmin()` in `lib/posts/queries.ts` uses `createSupabaseServerClient()` (the session client, not service role). For this to return draft posts, the admin's session client must satisfy the `posts_select_published_or_admin` policy. It will, because the policy subqueries `profiles` for admin role. This is correct.

---

## `comments` Table — `003_rls_comments.sql`

**RLS enabled:** YES

| Policy | Operation | Who | Condition |
|--------|-----------|-----|-----------|
| `comments_select_published_or_admin` | SELECT | anon + authenticated | Post is published OR actor is admin |
| `comments_insert_authenticated` | INSERT | authenticated | `user_id = auth.uid()` AND post is published |
| `comments_delete_own_or_admin` | DELETE | authenticated | `user_id = auth.uid()` OR actor is admin |

**Assessment: SOLID.**
- `user_id = auth.uid()` in the INSERT `WITH CHECK` means users cannot comment as another user via direct REST API — even if they submit a different `user_id` in the body, the policy will reject it.
- `comments_insert_authenticated` requires the target post to be published, so comments on draft posts are impossible at the DB layer regardless of what `post_id` is submitted in the form.
- No UPDATE policy: comments cannot be edited. Intentional.
- DELETE allows own comment deletion and admin deletion — both correct.

**Gap:** No delete UI exists in the application for comment authors or admins (no `deleteCommentAction` server action). The RLS allows it, but there's no application path to trigger it. Admin must delete via the Supabase dashboard.

---

## `podcast_episodes` Table — `004_rls_podcast_episodes.sql`

**RLS enabled:** YES

| Policy | Operation | Who | Condition |
|--------|-----------|-----|-----------|
| `podcast_episodes_select_published_or_admin` | SELECT | anon + authenticated | `status = 'published'` OR actor is admin |
| `podcast_episodes_insert_admin` | INSERT | authenticated | `author_id = auth.uid()` AND actor is admin |
| `podcast_episodes_update_admin` | UPDATE | authenticated | actor is admin |
| `podcast_episodes_delete_admin` | DELETE | authenticated | actor is admin |

**Assessment: SOLID.** Mirrors the posts pattern exactly. Draft episodes are not readable by regular users or anon clients.

---

## `tags` and `post_tags` Tables — `005_rls_tags.sql`

**RLS enabled:** YES (both tables)

**tags policies:** SELECT public, INSERT/UPDATE/DELETE admin-only.  
**post_tags policies:** SELECT public, INSERT/DELETE admin-only (no UPDATE needed for junction).

**Assessment: SOLID.** One note: `post_tags_select_public` uses `using (true)`, meaning anyone can read all tag-to-post associations. This is intentional — you need it to show tags on article cards. If posts had private/premium content in future, this would leak that association. At launch, fine.

---

## Storage — `006_rls_storage.sql`

**Buckets covered:** `post-images`, `podcast-images`

| Policy | Operation | Who | Condition |
|--------|-----------|-----|-----------|
| `post_images_select_public` | SELECT | public | `bucket_id = 'post-images'` |
| `post_images_insert_admin` | INSERT | authenticated | bucket + actor is admin |
| `post_images_update_admin` | UPDATE | authenticated | bucket + actor is admin |
| `post_images_delete_admin` | DELETE | authenticated | bucket + actor is admin |
| *(same pattern for `podcast-images`)* | | | |

**Assessment: SOLID.**

**Gap 1:** These policies assume the bucket IDs are exactly `post-images` and `podcast-images`. If buckets were created with different names in the Supabase dashboard, the policies target nonexistent buckets and storage is unprotected. Verify bucket IDs match.

**Gap 2:** Application code uses `validateAdminImageUpload()` for MIME/extension/size validation. The storage bucket itself has no MIME type restrictions configured at the Supabase level (that's a dashboard setting, not a SQL policy). The app-level validation is the primary guard. If someone calls the Supabase Storage REST API directly with an admin token and bypasses the Next.js action, the bucket will accept any file. At admin-only access level, this is acceptable risk.

---

## Security Trigger — `007_security_triggers.sql`

**Function:** `public.profiles_enforce_role_change()`  
**Trigger:** `profiles_enforce_role_change_trg` BEFORE INSERT OR UPDATE on `profiles`

The trigger checks:
- On INSERT: blocks `role = 'admin'` if the actor is not already admin
- On UPDATE: blocks `role` changes if the actor is not admin

Uses `SECURITY DEFINER` + `set search_path = public` — this is correct for bypassing RLS recursion when reading `profiles` to check the actor's role.

**One edge case:** `auth.uid()` in a trigger context. In Supabase, `auth.uid()` is populated from the JWT for authenticated requests. For service-role requests, `auth.uid()` returns NULL. This means a service-role UPDATE that changes `role` would see `actor_is_admin = false` and be **blocked by the trigger**. This could break the `getSessionUser()` function if it ever needs to update a profile role via the service role client.

Currently `getSessionUser()` only reads `profiles`, never writes it. And the README says to bootstrap the first admin via direct SQL (`update public.profiles set role = 'admin'`...) which is run as a privileged dashboard role (not via `auth.uid()`). In the dashboard SQL editor, `auth.uid()` returns NULL, which means `actor_is_admin = false`, which means the trigger would **block** the initial admin grant. The trigger code:

```sql
if tg_op = 'UPDATE' and (old.role is distinct from new.role) then
  if not coalesce(actor_is_admin, false) then
    raise exception 'Only admins may change profile role';
  end if;
end if;
```

Running `update public.profiles set role = 'admin' where id = '...'` in the SQL editor will hit this trigger, `auth.uid()` returns NULL, `actor_is_admin` = false, and the update will fail with "Only admins may change profile role."

**This is a bootstrapping problem: the trigger blocks the very first admin grant via SQL editor.**

The trigger needs a bypass for privileged database roles:
```sql
-- Add this check at the top of the trigger function body:
if current_setting('role', true) in ('postgres', 'service_role') then
  return new;
end if;
```

Or the README needs to say to temporarily disable the trigger for the first admin grant, then re-enable it.

---

## Comment Body Constraint — `008_comments_body_max_length.sql`

Adds `CHECK (char_length(body) <= 250)` idempotently. The app constant `COMMENT_BODY_MAX_CHARS = 250` matches.

**Assessment:** Correct. Two-layer defense (app validation + DB constraint).

---

## Summary

| Table | RLS Enabled | Policies Complete | Issues |
|-------|-------------|-------------------|--------|
| `profiles` | Yes (if migrated) | Yes | Email exposed to anon (HIGH); trigger blocks first admin grant (MEDIUM) |
| `posts` | Yes (if migrated) | Yes | None |
| `comments` | Yes (if migrated) | Yes | No UI to delete own comments |
| `podcast_episodes` | Yes (if migrated) | Yes | None |
| `tags` | Yes (if migrated) | Yes | None |
| `post_tags` | Yes (if migrated) | Yes | None |
| `storage.objects` | Yes (if migrated) | Yes | Bucket name assumption; no server-level MIME restriction |
