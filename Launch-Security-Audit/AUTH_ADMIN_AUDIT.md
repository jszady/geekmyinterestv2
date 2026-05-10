# Auth and Admin Access Audit

---

## Admin Access Control — Architecture

### Role Storage
`profiles.role` column. Value `"admin"` (lowercase string) grants access. `normalizeRole()` in `lib/auth/roles.ts` lowercases and trims before comparison — handles enum types and extra whitespace from the DB.

### Role Check Chain
```
getSessionUser()
  → evaluateAdminGate(session)
    → isAdmin(profile)
      → normalizeRole(profile?.role) === "admin"
```

Every admin server action calls `requireAdmin()` which runs this chain independently. The admin layout also runs this chain. Two separate, independent checks on every request.

### New Profile Role
`lib/auth/ensure-profile.ts` line 59 always inserts `role: "user"`. No signup path can produce an admin profile. CONFIRMED SAFE.

---

## Admin Server Actions

All three admin action files are guarded:

| File | Guard | Result on failure |
|------|-------|-------------------|
| `app/admin/post-actions.ts` | `requireAdmin()` first line of every exported action | `{ ok: false, error: "Unauthorized: admin only." }` |
| `app/admin/podcast-actions.ts` | `requireAdmin()` first line of every exported action | Same |
| `app/admin/tag-actions.ts` | `evaluateAdminGate(session)` checked, returns empty/error | Returns `[]` or `{ ok: false, error: "Unauthorized." }` |

**Assessment: ALL ADMIN MUTATIONS ARE CORRECTLY PROTECTED.**

Direct Q&A:
- **Can a normal user create a blog post?** No. `createPostAction` calls `requireAdmin()` → returns unauthorized before any DB write.
- **Can a normal user edit or delete a post?** No. Same.
- **Can a normal user create/edit/delete a podcast episode?** No. Same pattern in `podcast-actions.ts`.
- **Can a normal user manage tags?** No. `searchTagsAction` and `ensureTagByNameAction` both check `evaluateAdminGate()`.

---

## Admin Layout Gate

`app/admin/layout.tsx` calls `getSessionUser()` → `evaluateAdminGate()` → `redirect()` server-side before any child renders. This is the first gate hit on every `/admin/**` request.

**Middleware does NOT protect `/admin`** — `middleware.ts` only handles profile completion redirects. This is noted but not a vulnerability: Next.js App Router runs layout.tsx on the server before sending any response. There is no way to receive admin page HTML without passing the layout check.

---

## OAuth Callback — Open Redirect

**FIXED.** `app/auth/callback/route.ts` now uses:
```typescript
const nextPath = safeRedirect(nextRaw, url.origin);
```

`safeRedirect` in `lib/auth/safe-redirect.ts`:
```typescript
export function safeRedirect(next: string | null, origin: string): string {
  if (!next) return "/";
  try {
    const resolved = new URL(next, origin);
    if (resolved.origin !== origin) return "/";
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return "/";
  }
}
```

Attempting `?next=https://evil.com` returns `"/"` because `resolved.origin !== url.origin`. CONFIRMED FIXED.

---

## Signup Flow — `signUpAction`

**Password minimum:** No server-side minimum length check. Supabase default is 6 chars but this should be enforced in the action. See CRITICAL_VULNERABILITIES.md VULN-3.

**Username validation:** Regex `/^[a-z0-9_-]+$/` enforced. Good.

**Email/username uniqueness:** Checked via ILIKE before calling `supabase.auth.signUp()`. Duplicate checks run in two layers (app + Supabase auth). Good.

**Unguarded `console.log`:** Lines 47–52 and 94–99 log to production server logs. See CRITICAL_VULNERABILITIES.md VULN-2.

**`emailRedirectTo` when `NEXT_PUBLIC_SITE_URL` is not set:** Falls back to empty string `""`, which means `emailRedirectTo` is `undefined`. Supabase will use its configured Site URL as the redirect target. If the Supabase Auth → URL Configuration "Site URL" is set correctly in the dashboard, this works. If not, email confirmation links break. Verify in Supabase Auth settings.

---

## Password Reset Flow

`ForgotPasswordForm.tsx` is a client component. It calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })` directly from the browser.

```typescript
const redirectBase =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";
const redirectTo = `${redirectBase}/update-password`;
```

**Issue:** If `NEXT_PUBLIC_SITE_URL` is not set in the production environment, `redirectBase` falls back to `http://localhost:3000`. Password reset emails will link to `http://localhost:3000/update-password` — which doesn't exist in production. Users cannot reset their password. This is a **reliability blocker**, not a security issue, but it will silently break a critical user flow at launch.

`UpdatePasswordForm.tsx` uses the browser Supabase client to call `supabase.auth.updateUser({ password })`. This requires the user to be in a valid password recovery session (established by the email link). Correct behavior — no security issue.

**Password minimum in update form:** 6 characters (client-side `minLength={6}` and JS check). Consistent with Supabase default. No server-side enforcement (client calls Supabase directly, not through a server action). The Supabase auth server enforces its own minimum. Acceptable.

---

## Session Management

Handled by `@supabase/ssr`. Cookies set with `HttpOnly`, `SameSite=Lax`, `Secure` (production). Session validated server-side via `supabase.auth.getUser()` on every protected request — not just JWT decode. Revoked sessions are caught.

**CSRF:** Next.js Server Actions include built-in Origin header validation. Cross-origin form POSTs are rejected. The one API route (`/api/search`) is GET-only and read-only — no CSRF risk.

---

## Service Role Key

`SUPABASE_SERVICE_ROLE_KEY` is used only in `lib/auth/session.ts`, called from `lib/supabase/admin.ts`. Neither file has `"use client"`. The key is prefixed `SUPABASE_` (not `NEXT_PUBLIC_`), so Next.js never bundles it into client code.

To verify after a production build:
```bash
grep -r "SERVICE_ROLE" .next/static/
# Should return nothing
```

**Assessment: SERVICE ROLE KEY EXPOSURE IS NOT A RISK.**

---

## Profile Completion Flow

`completeProfileAction` in `app/auth/actions.ts`:
- Reads auth user server-side
- Updates only `username` column: `.update({ username: cleaned })`
- Application code never touches `role` in this action

**Role escalation via direct REST API:** Blocked by the trigger in `007_security_triggers.sql`. A non-admin calling `PATCH /rest/v1/profiles?id=eq.{my_id}` with `{"role":"admin"}` will hit the trigger which raises an exception. CONFIRMED PROTECTED — as long as the migration has been applied.

**One bootstrapping problem:** The trigger also blocks the initial admin grant via the Supabase SQL editor. See DATABASE_RLS_AUDIT.md for details and fix.

---

## Answers to All Auth Questions

| Question | Answer |
|----------|--------|
| Can a normal user create/edit/delete posts? | No — `requireAdmin()` blocks at action level |
| Can a normal user create/edit/delete podcast episodes? | No — same |
| Can a user promote themselves to admin? | No — trigger blocks role changes by non-admins |
| Are admin server actions protected server-side? | Yes — double-guarded (layout + action) |
| Is the service role key in client bundle? | No — verified server-only |
| Is OAuth callback safe from open redirect? | Yes — `safeRedirect()` is in place |
| Are comments rate-limited? | Yes — 5 per 60 seconds |
| Are comments capped at 250 chars? | Yes — app constant + DB constraint |
| Can users comment as another user? | No — `user_id` forced from session server-side; RLS enforces `user_id = auth.uid()` |
| Can comments attach to unpublished posts? | No — RLS `WITH CHECK` requires published post |
| Password reset emails go to correct URL? | Only if `NEXT_PUBLIC_SITE_URL` is set in production — VERIFY |
