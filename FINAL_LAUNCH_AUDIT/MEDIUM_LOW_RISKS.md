# Medium & Low Priority Risks — Pre-Launch Audit

Items that are worth tracking but don't block launch. Address in the first sprint post-launch or as part of ongoing hardening.

---

## Medium Priority

### M1. Comment Rate Limit Is Per-Request, Not Persistent

**File:** `lib/comments/constants.ts`, `app/articles/comment-actions.ts`

The rate limit (5 comments per 60 seconds per user) is enforced by counting recent rows from the `comments` table. This is correct and persistent across restarts, but:

- The window is calculated from `NOW() - INTERVAL '60 seconds'` — a sliding window. Back-to-back requests can still post burst comments at the very edge of the window.
- There is no total daily cap. A determined user could post 5 comments every 60 seconds around the clock (7,200 per day).
- Anonymous unauthenticated users are blocked by the auth check before reaching the rate limit check, which is correct.

**Recommendation:** Add a daily cap (e.g., 100 comments/user/day) and consider per-article limits to prevent spam flooding one article.

---

### M2. Avatar Upload Allows SVG via Preset URL

**File:** `lib/profile/signup-avatar.ts`, `app/auth/actions.ts`

The signup flow accepts a `signup_avatar_url` preset path (a relative storage path from a set of preset avatars). This path is not validated against an allowlist at the server action level — it's passed through to the profile row as-is. If the client sends an arbitrary URL as the preset, it gets stored in `avatar_url`.

While the avatar is rendered with `<img>` (not `<Image>`), a stored attacker-controlled URL could:
- Point to a tracking pixel.
- Point to a self-hosted image that logs IPs.

**Recommendation:** Validate `signup_avatar_url` against an explicit allowlist of known preset paths before storing:

```ts
const ALLOWED_PRESETS = ["/avatars/preset-1.webp", "/avatars/preset-2.webp", ...];
if (signupAvatarPath && !ALLOWED_PRESETS.includes(signupAvatarPath)) {
  signupAvatarPath = null; // reject unknown preset paths
}
```

---

### M3. `resolveAuthorHeaderImageForDisplay` Has Implicit URL Construction

**File:** `lib/profile/author-header-display-url.ts`

The function constructs the Supabase Storage public URL by string-concatenating the bucket URL with the stored path. If the stored path already contains a full URL (e.g., from an older record or manual DB edit), this produces a double-URL like `https://...supabase.co/storage/.../https://...`.

**Recommendation:** Add a guard:

```ts
if (storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
  return storedPath; // already a full URL, use as-is
}
```

---

### M4. Admin Post/Podcast Forms Accept Any Image URL

**File:** `components/admin/AdminPostForm.tsx`, `components/admin/AdminPodcastForm.tsx`

The admin forms include an image URL text input that is stored directly without validation. An admin can type any URL (including `http://` HTTP URLs, local IPs, or internal network addresses) and it gets stored and rendered.

This is a low-severity SSRF vector if Next.js ever fetches that URL server-side (e.g., for `next/image` optimization), and also a minor content integrity issue.

**Recommendation:** Validate the URL scheme on save (`https://` only, no private IP ranges), or restrict to the same `remotePatterns` used in `next.config.ts`.

---

### M5. No Audit Log for Admin Actions

**Files:** `app/admin/post-actions.ts`, `app/admin/podcast-actions.ts`

Admin publish, delete, and edit operations are not logged anywhere. If an admin account is compromised:
- There is no record of which posts were modified or deleted.
- There is no timestamp trail for incident response.

**Recommendation:** Add an `admin_audit_log` table with columns `(id, actor_id, action, target_table, target_id, created_at)` and insert a row inside each admin action. This is a post-launch quality-of-life item.

---

### M6. `profiles.email` Column Exposed to Authenticated Users via Direct Query

**File:** Supabase migrations

The `profiles_public` view correctly excludes `email` and `role`. However, any authenticated user can query the `profiles` table directly (not the view) if RLS on `profiles` allows `SELECT` for authenticated role. The exact policy was not visible in the migration files reviewed, but if authenticated users can `SELECT * FROM profiles WHERE id = X`, they can read `email`.

**Recommendation:** Verify the `profiles` RLS SELECT policy — it should either:
1. Restrict `SELECT` on `profiles` to `id = auth.uid()` (own row only) plus a separate `profiles_public` view for others.
2. Use column-level security or a computed column to hide `email` from the `profiles` table itself.

---

## Low Priority

### L1. Error Messages Leak Internal Details

**Files:** `app/auth/actions.ts`, `app/articles/comment-actions.ts`

Some error returns pass raw Supabase error messages directly to the client:
```ts
return { ok: false, error: updateError.message };
```

Supabase error messages can include table names, column names, constraint names, and partial query text. This is low-risk (the DB schema is not secret) but violates defense-in-depth.

**Recommendation:** Map known error codes to user-friendly messages; log the raw error server-side only.

---

### L2. Username Taken Check Uses Case-Insensitive ILIKE Without Index

**File:** `app/auth/actions.ts`, `components/auth/CompleteProfileForm.tsx`

The uniqueness check uses `.ilike("username", pattern)`. ILIKE queries in Postgres do not use a standard btree index — they require a case-insensitive index (e.g., `citext` or functional index on `lower(username)`).

**Recommendation:** Add a migration:
```sql
CREATE UNIQUE INDEX profiles_username_lower_idx ON profiles (lower(username));
```

And change queries to use `eq("username", username.toLowerCase())` for index-efficient lookups.

---

### L3. `forgot-password` and `update-password` Not Audited

These flows exist (`app/forgot-password/`, `app/update-password/`) but were not reviewed in this audit. Ensure:
- The reset token is single-use (Supabase handles this by default).
- The new password is validated for minimum length.
- The `update-password` route requires a valid reset token (not just an active session).

---

### L4. No `robots.txt` Exclusion for Admin Routes

**File:** `app/robots.ts`

If `app/robots.ts` doesn't explicitly disallow `/admin`, search engine crawlers may attempt to index admin pages. The pages are protected by auth, so content won't be exposed, but unnecessary crawl attempts add log noise and could reveal admin route existence.

**Recommendation:** Ensure `robots.ts` includes:
```ts
disallow: ["/admin", "/account", "/complete-profile"],
```
