# High Priority Risks — Pre-Launch Audit

Issues that are not immediately exploitable but carry meaningful risk within the first weeks of operation. Address before or shortly after launch.

---

## 1. Hardcoded Supabase Hostname in Image Remote Patterns

**Severity:** High  
**File:** `next.config.ts`

The `remotePatterns` for Next.js Image contains a hardcoded Supabase project hostname. If the project is migrated, cloned, or the env variable changes, images will silently break. More importantly, a wildcard or wrong pattern can allow arbitrary external images to be proxied through the Next.js image optimizer, which could be abused to make the server fetch attacker-controlled URLs.

**Current pattern (approximate):**
```ts
remotePatterns: [
  { protocol: "https", hostname: "*.supabase.co" },
]
```

**Risk:** The `*.supabase.co` wildcard allows any Supabase project's storage to be proxied — not just your own. An attacker who knows your image endpoint can craft `/_next/image?url=https://attacker-project.supabase.co/...` to proxy arbitrary content.

**Fix:** Pin to your specific project hostname using the env variable:

```ts
const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;

remotePatterns: [
  { protocol: "https", hostname: supabaseHost },
]
```

---

## 2. Comment Deletion Uses N+1 Delete Loop

**Severity:** High (performance + atomicity)  
**File:** `app/articles/comment-actions.ts`

When an admin deletes all comments on a post (or batch-deletes), the action loops over comment IDs and issues one `DELETE` query per comment. This is an N+1 pattern that:

- Takes O(N) round-trips to the database for N comments.
- Is not atomic — if the action fails partway through, some comments are deleted and others are not.
- Can cause visible UI inconsistency on a page with many comments.

**Fix:** Use Supabase's `.in()` filter to delete all matching rows in a single query:

```ts
const { error } = await supabase
  .from("comments")
  .delete()
  .in("id", commentIds);
```

---

## 3. No CSRF Protection on Server Actions

**Severity:** High  
**Files:** All `"use server"` action files

Next.js Server Actions are POST-only and require `Content-Type: multipart/form-data` or `application/x-www-form-urlencoded`, which provides some CSRF resistance. However, the app does not set `SameSite=Strict` or `SameSite=Lax` on the Supabase auth cookie explicitly, and does not add a CSRF token to any form.

Supabase's client library sets its own cookies, but the exact `SameSite` attribute depends on the Supabase client version and browser. If the cookie is `SameSite=None` (common for cross-origin OAuth flows), CSRF is a real risk for state-mutating actions.

**Fix (minimal):**
- Verify Supabase auth cookies are issued with `SameSite=Lax` (check browser DevTools after login).
- For the admin actions that are highest-value (post publish, role changes), add a custom CSRF token header check:

```ts
const csrfToken = formData.get("_csrf");
if (!csrfToken || csrfToken !== session.csrfToken) {
  return { ok: false, error: "Invalid request." };
}
```

---

## 4. Service Role Key Available at Runtime in All Server Contexts

**Severity:** High  
**Files:** `lib/supabase/admin.ts`, `app/auth/actions.ts`, `app/account/settings/actions.ts`

`SUPABASE_SERVICE_ROLE_KEY` is used in server actions to bypass RLS for avatar uploads and profile upserts. This is necessary but creates risk:

- Any Server Action that accidentally imports `createSupabaseServiceRoleClient` gains full DB access with no RLS.
- A dependency confusion or supply chain attack on an imported package could exfiltrate the key via `process.env`.
- The key is checked with `?.trim()` in multiple places — if it's undefined the code silently falls back to the user session client, which may not have write permission for the operation, causing silent failures.

**Fix:**
- Audit all imports of `createSupabaseServiceRoleClient` — it should only appear in trusted server-only files.
- Add `server-only` package import at the top of `lib/supabase/admin.ts` to get a build-time error if it's ever accidentally imported in a client component:

```ts
import "server-only";
```

- Make the key required (throw early) rather than silently falling back:

```ts
export function createSupabaseServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  // ...
}
```

---

## 5. Google OAuth Callback Does Not Re-Validate Username

**Severity:** High  
**File:** `app/auth/callback/route.ts`

After Google OAuth, the callback calls `ensureProfileRowForUser` which inserts a profile row. The username is derived from the Google account display name. There is no check that this auto-generated username:

1. Doesn't collide with an existing username.
2. Meets the same validation rules as the manual signup form.
3. Doesn't contain characters forbidden by the `profiles` table `CHECK` constraint.

If two Google users have the same display name, the second sign-in could fail silently or produce a DB error that surfaces as a generic "try again" message.

**Fix:** In `ensureProfileRowForUser`, use `upsert` with `onConflict: "username"` fallback logic, or append a random suffix if the username is taken:

```ts
let candidateUsername = slugify(user.user_metadata.full_name ?? user.email);
const { data: exists } = await supabase.from("profiles").select("id").eq("username", candidateUsername).maybeSingle();
if (exists) candidateUsername = `${candidateUsername}-${Math.random().toString(36).slice(2, 6)}`;
```

---

## 6. Missing `server-only` Guard on Admin Gate

**Severity:** High  
**File:** `lib/auth/admin-gate.ts`

`evaluateAdminGate` reads auth session and profile data — it must never run on the client. There is no `import "server-only"` guard. If a developer accidentally imports it in a client component, Next.js will bundle it (and its Supabase server client dependency) client-side, potentially leaking the server client factory and environment variable names.

**Fix:**
```ts
import "server-only";
```

Add this as the first line of `lib/auth/admin-gate.ts` and `lib/auth/session.ts`.
