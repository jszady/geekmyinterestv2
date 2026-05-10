# Fix Plan

Ordered by priority. Do the BLOCKER section first — in order. Everything in BLOCKER must be done before you open the site to the public.

---

## Phase 0 — Database (Do This First, Outside the Code)

### Step 1: Fix the role escalation trigger to allow privileged bootstrap

In Supabase Dashboard → SQL Editor, replace the existing trigger function:

```sql
create or replace function public.profiles_enforce_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
  acting_role text;
begin
  -- Privileged database roles (postgres, service_role) bypass this check.
  -- This allows bootstrapping the first admin from the SQL editor.
  select current_user into acting_role;
  if acting_role in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and lower(trim(coalesce(p.role::text, ''))) = 'admin'
  ) into actor_is_admin;

  if tg_op = 'INSERT' then
    if lower(trim(coalesce(new.role::text, ''))) = 'admin'
       and not coalesce(actor_is_admin, false) then
      raise exception 'Only admins may create profiles with admin role';
    end if;
  end if;

  if tg_op = 'UPDATE' and (old.role is distinct from new.role) then
    if not coalesce(actor_is_admin, false) then
      raise exception 'Only admins may change profile role';
    end if;
  end if;

  return new;
end;
$$;
```

This replaces the function in place — the trigger itself (`profiles_enforce_role_change_trg`) does not need to be recreated.

### Step 2: Apply all migrations to production

Run in this exact order in Supabase Dashboard → SQL Editor:

```
001_rls_profiles.sql
002_rls_posts.sql
003_rls_comments.sql
004_rls_podcast_episodes.sql
005_rls_tags.sql
006_rls_storage.sql
007_security_triggers.sql   ← run the UPDATED version from Step 1, not the file
008_comments_body_max_length.sql
```

After running, verify:
```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
-- All should show rowsecurity = true

select count(*) from pg_policies where schemaname = 'public';
-- Should be > 0
```

### Step 3: Grant first admin

After the updated trigger is in place, run from the SQL editor:
```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_SUPABASE_AUTH_USER_UUID';
```

This now works because `current_user = 'postgres'` in the SQL editor, which bypasses the trigger check.

### Step 4: Fix the email enumeration policy

```sql
-- Remove the anon-readable policy
drop policy if exists "profiles_select_public" on public.profiles;

-- Authenticated users can read all profiles (needed for comment author names)
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Anon users can read only id + username (needed for public author pages)
create policy "profiles_select_anon_limited"
  on public.profiles
  for select
  to anon
  using (true);
```

Note: Supabase RLS cannot restrict which *columns* are returned — only whether the *row* is visible. To truly hide `email` from anon clients, you need either:

**Option A (quickest — change policy to authenticated-only):**
```sql
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select to authenticated using (true);
```
Anon users can no longer read any profile data. Public author pages (`/authors/[username]`) use server components with a cookie session — they will still work since the server reads profiles with an authenticated client. Public comment author names in article pages use server-side rendering too. Test this before launching.

**Option B (if anon reads are genuinely needed somewhere):**
Create a view that excludes email and grant anon access to the view only:
```sql
create or replace view public.profiles_public as
  select id, username, created_at from public.profiles;
revoke select on public.profiles from anon;
grant select on public.profiles_public to anon;
```
Then update any app code that uses `supabase.from("profiles")` in anon context to use `.from("profiles_public")` instead.

### Step 5: Verify storage bucket names

In Supabase Dashboard → Storage, confirm the bucket IDs are exactly:
- `post-images` (not `post_images`, not `postImages`)
- `podcast-images` (not `podcast_images`)

If they differ, update `006_rls_storage.sql` and re-run it, OR rename the buckets to match.

---

## Phase 1 — Code Changes (15–30 minutes total)

### Fix 1: Add console.log guards in signUpAction (5 min)

**File:** `app/auth/actions.ts`

Wrap lines 47–52:
```typescript
if (process.env.NODE_ENV === "development") {
  console.log("[signup] username availability check:", {
    submittedUsername,
    normalizedUsername: username,
    rows: takenUsernameRows ?? [],
    error: usernameCheckError ?? null,
  });
}
```

Wrap lines 94–99:
```typescript
if (process.env.NODE_ENV === "development") {
  console.log("[signup] supabase signUp response:", {
    hasUser: Boolean(data.user),
    hasSession: Boolean(data.session),
    identitiesCount: data.user?.identities?.length ?? 0,
    error,
  });
}
```

### Fix 2: Add server-side password minimum (5 min)

**File:** `app/auth/actions.ts`

After the non-empty check on line 23, add:
```typescript
if (password.length < 8) {
  return {
    ok: false,
    error: "Password must be at least 8 characters.",
    reason: "validation",
  };
}
```

Also update the `signUpForm` component to show `minLength={8}` in the password input if it currently shows 6.

### Fix 3: Add honeypot to contact form (10 min)

**File:** `app/contact/actions.ts`

At the top of `submitContactForm`, after extracting `contactType`:
```typescript
const honeypot = String(formData.get("_hp") ?? "");
if (honeypot) {
  return { ok: false, error: "Submission blocked." };
}
```

**File:** `app/contact/page.tsx` or the contact form component (wherever the `<form>` is rendered)

Add a hidden honeypot input inside the form:
```tsx
<input
  type="text"
  name="_hp"
  defaultValue=""
  style={{ display: "none" }}
  tabIndex={-1}
  autoComplete="off"
  aria-hidden="true"
/>
```

### Fix 4: Add UUID validation for `post_id` in comment action (5 min)

**File:** `app/articles/comment-actions.ts`

After line 42 (`if (!postId) return ...`), add:
```typescript
if (!UUID_RE.test(postId)) {
  return { ok: false, error: "Invalid post." };
}
```

The `UUID_RE` constant is already defined in the same file.

### Fix 5: Add search response caching (5 min)

**File:** `app/api/search/route.ts`

Change the success return to:
```typescript
return NextResponse.json({ ok: true as const, results }, {
  headers: {
    "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
  },
});
```

---

## Phase 2 — Environment Variables (Verify Before Going Live)

Check each of these in your Vercel project settings → Environment Variables:

| Variable | Required | What breaks if missing |
|----------|----------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | YES | Nothing works |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | Nothing works |
| `NEXT_PUBLIC_SITE_URL` | YES | Password reset links go to localhost; email confirmations may fail |
| `SUPABASE_SERVICE_ROLE_KEY` | Strongly recommended | Admin role may not resolve correctly without it |
| `RESEND_API_KEY` | Optional | Contact form submissions only logged, not emailed |
| `RESEND_FROM_EMAIL` | With RESEND_API_KEY | Contact emails fail |
| `CONTACT_TO_EMAIL` | With RESEND_API_KEY | Contact emails fail |

Also check in Supabase Dashboard → Auth → URL Configuration:
- **Site URL:** Must be `https://geekmyinterest.com` (or your domain)
- **Redirect URLs:** Must include `https://geekmyinterest.com/auth/callback`

---

## Phase 3 — Post-Launch (Non-Blocking)

### Add comment delete actions

In `app/articles/comment-actions.ts`, add:
```typescript
export async function deleteCommentAction(
  commentId: string,
  postSlug: string,
): Promise<CommentActionState> {
  const session = await getSessionUser();
  if (!session?.user) return { ok: false, error: "Not authenticated." };

  const supabase = await createSupabaseServerClient();

  // RLS handles authorization: users can only delete their own; admins can delete any
  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/articles/${postSlug}`);
  return { ok: true, error: null };
}
```

### Clean up orphaned images on post update

In `updatePostAction`, after the update succeeds:
```typescript
// After: const { error } = await supabase.from("posts").update(patch).eq("id", postId);
// Before returning:
const imagesToRemove: string[] = [];
if (newCard && row.card_image && newCard !== row.card_image) {
  imagesToRemove.push(row.card_image);
}
if (newHero && row.hero_image && newHero !== row.hero_image) {
  imagesToRemove.push(row.hero_image);
}
if (imagesToRemove.length) {
  await removeStoragePaths(supabase, imagesToRemove);
}
```

### Add proper rate limiting to contact form

After the honeypot, implement a proper IP-based cooldown using Vercel KV or Upstash:
```typescript
// Using @vercel/kv or @upstash/ratelimit
// Allow 3 contact form submissions per hour per IP
```

---

## Pre-Launch Checklist

Run through this before opening to public traffic:

- [ ] Updated role escalation trigger deployed (allows postgres role bypass)
- [ ] All 8 migrations applied to production Supabase
- [ ] First admin account granted via SQL editor
- [ ] `profiles_select_public` policy changed to remove anon email access
- [ ] Storage bucket IDs verified (`post-images`, `podcast-images`)
- [ ] `NEXT_PUBLIC_SITE_URL` set in Vercel environment variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set in Vercel environment variables
- [ ] Supabase Auth → Site URL set to production domain
- [ ] Supabase Auth → Redirect URLs includes `/auth/callback`
- [ ] `console.log` guards added in `signUpAction`
- [ ] Password minimum added to `signUpAction`
- [ ] Contact form honeypot added
- [ ] Test: sign up, sign in, Google OAuth, comment, contact form
- [ ] Test: visiting `/admin` when not logged in → redirects to login
- [ ] Test: password reset email arrives and link works
- [ ] Verify: `grep -r "SERVICE_ROLE" .next/static/` returns nothing
