# Launch Blockers

Do not launch until BLOCKER items are resolved. HIGH items should be resolved before launch. MEDIUM and LOW are post-launch or optional.

---

## BLOCKER — All RLS Migrations Must Be Applied to Production

**Why it's a blocker:** Without the migrations, RLS does not exist on any table. Any authenticated user can read draft posts, insert posts, modify comments, and set their own `role = 'admin'` via direct Supabase REST API.

**What to do:** In the Supabase dashboard → SQL Editor, run each migration file in order:

1. `supabase/migrations/001_rls_profiles.sql`
2. `supabase/migrations/002_rls_posts.sql`
3. `supabase/migrations/003_rls_comments.sql`
4. `supabase/migrations/004_rls_podcast_episodes.sql`
5. `supabase/migrations/005_rls_tags.sql`
6. `supabase/migrations/006_rls_storage.sql`
7. `supabase/migrations/007_security_triggers.sql`
8. `supabase/migrations/008_comments_body_max_length.sql`

**Verify with:**
```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
-- All content tables should show rowsecurity = true

select policyname, tablename, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
-- Should return rows for profiles, posts, comments, podcast_episodes, tags, post_tags
```

---

## BLOCKER — Role Escalation Trigger Blocks Initial Admin Grant

**File:** `supabase/migrations/007_security_triggers.sql`  
**Impact:** The `profiles_enforce_role_change` trigger uses `auth.uid()` to check if the actor is admin. In the Supabase SQL editor (dashboard), `auth.uid()` returns NULL. This causes `actor_is_admin = false`, which means the trigger will block `UPDATE public.profiles SET role = 'admin' WHERE id = '...'` run from the SQL editor. The README says to use exactly this SQL to bootstrap the first admin — it won't work.

**Fix options:**

Option A — Temporarily bypass the trigger for bootstrapping:
```sql
-- Disable the trigger temporarily
alter table public.profiles disable trigger profiles_enforce_role_change_trg;

-- Grant first admin
update public.profiles set role = 'admin' where id = 'YOUR_UUID';

-- Re-enable
alter table public.profiles enable trigger profiles_enforce_role_change_trg;
```

Option B — Update the trigger function to allow privileged database roles to bypass it:
```sql
create or replace function public.profiles_enforce_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
  current_role text;
begin
  -- Allow postgres / service_role to change roles without restriction
  select current_user into current_role;
  if current_role in ('postgres', 'service_role', 'supabase_admin') then
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

Option B is cleaner — apply it before running the initial admin grant.

---

## BLOCKER — `profiles_select_public` Exposes User Emails to Unauthenticated Clients

**File:** `supabase/migrations/001_rls_profiles.sql` lines 8–13  
**Details:** See CRITICAL_VULNERABILITIES.md VULN-1

The current policy grants SELECT to `anon` with `using (true)`. Any person with the anon key (embedded in the browser bundle) can dump all user emails via:
```
GET /rest/v1/profiles?select=email
```

**Fix before launch:** Change the policy to restrict email access to the owning user and admins. See CRITICAL_VULNERABILITIES.md VULN-1 for the full fix. The simplest version:
```sql
drop policy if exists "profiles_select_public" on public.profiles;

-- Non-sensitive fields only for public
-- (requires a view or column-level grants — see full fix in CRITICAL_VULNERABILITIES.md)

-- At minimum, restrict to authenticated users:
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated  -- removes anon access
  using (true);
```

This at least requires a valid login session to enumerate users (much harder to abuse).

---

## BLOCKER — `NEXT_PUBLIC_SITE_URL` Must Be Set in Production

**Files affected:**
- `app/auth/actions.ts` line 85 — `emailRedirectTo` for email confirmation links
- `components/auth/ForgotPasswordForm.tsx` line 27 — password reset redirect URL

If not set:
- Email confirmation links will use whatever Supabase has as "Site URL" in Auth settings (may or may not be correct)
- Password reset email links will redirect to `http://localhost:3000/update-password` — **completely broken in production**

**Fix:** Set `NEXT_PUBLIC_SITE_URL=https://geekmyinterest.com` (or your domain) in Vercel environment variables. Also verify the Supabase Auth → URL Configuration "Site URL" and "Redirect URLs" are set to the production domain.

---

## HIGH — Contact Form Has No Rate Limiting

**File:** `app/contact/actions.ts`  
**Details:** See CRITICAL_VULNERABILITIES.md VULN-4

A bot can submit the contact form indefinitely, exhausting Resend API quota and flooding the admin inbox. No auth required, no IP check, no submission cooldown.

**Minimum fix before launch:**
```typescript
// Add honeypot field to the form component
const honeypot = String(formData.get("_hp") ?? "");
if (honeypot) return { ok: false, error: "Submission rejected." };
```

Add `<input type="text" name="_hp" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />` to the contact form. Bots fill it in; humans don't. Blocks most automated scrapers with zero friction.

---

## HIGH — `signUpAction` Logs User Data in Production

**File:** `app/auth/actions.ts` lines 47–52, 94–99  
**Details:** See CRITICAL_VULNERABILITIES.md VULN-2

Two `console.log` calls are not inside `NODE_ENV === "development"` guards. They will write usernames and signup data to Vercel production logs on every signup attempt.

**Fix:** 5 minutes. Wrap both calls in `if (process.env.NODE_ENV === "development") { ... }`.

---

## HIGH — Password Reset Link Will Redirect to localhost in Production

**File:** `components/auth/ForgotPasswordForm.tsx` lines 26–29  
**Details:** See AUTH_ADMIN_AUDIT.md — Password Reset Flow

If `NEXT_PUBLIC_SITE_URL` is not set, `redirectBase` defaults to `"http://localhost:3000"`. Password reset emails go out with a link to localhost. Users cannot reset passwords.

**Fix:** Set the env var. Covered by BLOCKER above.

---

## MEDIUM — No Server-Side Password Minimum in Signup

**File:** `app/auth/actions.ts`  
**Fix:** Add `if (password.length < 8) return { ok: false, error: "...", reason: "validation" }` before the username check.

---

## MEDIUM — `/api/search` Has No Rate Limiting or Caching

**File:** `app/api/search/route.ts`  
Each request runs 4–5 parallel Supabase queries. No auth, no throttle. At moderate traffic, database connection pool can saturate.

**Minimum fix:** Add `Cache-Control` headers to cache identical search results for 30 seconds:
```typescript
return NextResponse.json({ ok: true, results }, {
  headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
});
```

---

## LOW — `post_id` Not UUID-Validated in Comment Action

**File:** `app/articles/comment-actions.ts`  
`parent_comment_id` is UUID-validated; `post_id` is not. A non-UUID `post_id` reaches Supabase and returns a raw error. Add the UUID regex check for cleaner error handling.

---

## LOW — Old Images Not Deleted When Posts Are Updated

**File:** `app/admin/post-actions.ts`  
When a post is updated with a new image, the old image path is abandoned in Supabase storage. No security impact, but storage usage grows unbounded. Fix post-launch.

---

## LOW — No Comment Deletion UI

**File:** `app/articles/comment-actions.ts` (missing)  
The RLS allows admins and comment authors to delete comments. No server action exists to exercise this. Admin must use Supabase dashboard to delete comments. Acceptable at launch; add the action post-launch.

---

## NOT A PROBLEM — Items That Look Scary But Are Fine

| Item | Why it's fine |
|------|---------------|
| Middleware doesn't protect `/admin` | App Router layout protection is equivalent and correct |
| Service role key in `lib/auth/session.ts` | Server-only file, not `"use client"`, not `NEXT_PUBLIC_` |
| `completeProfileAction` updates profiles | Only updates `username` column; trigger blocks role changes |
| `profiles_update_own_or_admin` policy | Trigger prevents role escalation; policy update path correct |
| No `dangerouslySetInnerHTML` on user content | React renders all user strings as escaped text nodes |
| OAuth state management | Handled by Supabase PKCE; not custom-rolled |

---

## Launch Readiness Summary

| Category | Status |
|----------|--------|
| RLS migrations applied | ❌ Must verify |
| First admin bootstrap (trigger fix needed) | ❌ Must fix |
| Email enumeration via profiles | ❌ Must fix |
| NEXT_PUBLIC_SITE_URL set in production | ❌ Must set |
| Contact form rate limiting | ⚠ Partial fix needed |
| Production console.log cleanup | ⚠ Quick fix |
| Password minimum | ⚠ Quick fix |
| Search rate limiting | ⚠ Optional but recommended |
| Admin mutations | ✅ Solid |
| Upload validation | ✅ Solid |
| Comment abuse protection | ✅ Solid |
| Open redirect | ✅ Fixed |
| Role escalation | ✅ Fixed (after trigger bootstrap fix) |
| XSS | ✅ Not present |
| CSRF | ✅ Handled by Next.js |
| Service role key exposure | ✅ Not exposed |
