# Security Scorecard — Pre-Launch Audit

Overall security posture: **6.5 / 10 — Conditional Pass**

The core auth and data access layers are well-built. RLS is enabled everywhere, the admin gate is double-validated, and upload validation exists for user avatars. The gaps are at the HTTP/network layer (no security headers) and in operational safeguards (no rate limiting on email, no magic-byte check on admin uploads).

---

## Dimension Scores

| Dimension | Score | Notes |
|---|---|---|
| Authentication | 8/10 | Email/password + Google OAuth. Session handled server-side. ensureProfileRowForUser prevents orphan sessions. |
| Authorization (RLS) | 9/10 | All tables have RLS. Security trigger blocks role escalation. profiles_public view hides email/role. Admin gate double-checked in layout + actions. |
| Input Validation | 7/10 | Good on user inputs (username, comments, lengths). Missing magic-byte check on admin image uploads. |
| Upload Security | 7/10 | User avatar path uses magic-byte sniff. Admin upload path uses MIME + extension only. Bucket RLS enforces user-folder isolation. |
| HTTP Security Headers | 2/10 | Zero security headers. No CSP, no X-Frame-Options, no HSTS enforcement. |
| Rate Limiting | 3/10 | Comment rate limit is solid (DB-backed). Contact form has only a honeypot — no real limit. No rate limit on auth endpoints beyond Supabase's built-in. |
| Error Handling | 6/10 | Errors are caught and mapped. Some raw Supabase messages leak to the client. Consistent use of ok/error return shape across server actions. |
| Secrets Management | 7/10 | .env.example documented. Service role key accessed only in server context. No server-only guard on admin-gate.ts. |
| Logging (Production) | 8/10 | Debug logging removed. Legitimate error logs (console.error) retained in appropriate places. |
| CSRF Protection | 5/10 | Server Actions provide some protection by design. No explicit CSRF tokens. SameSite cookie behavior depends on Supabase version. |
| Dependency Supply Chain | 5/10 | Not audited in depth. No evidence of lockfile pinning audit or dependency scanning in CI. |
| SEO/Crawl Safety | 6/10 | robots.ts exists. Admin routes may not be excluded. |

---

## Must-Fix Before Launch

| # | Issue | File |
|---|---|---|
| C1 | Add HTTP security headers (CSP, X-Frame-Options, etc.) | `next.config.ts` |
| C2 | Add rate limiting to contact form | `app/contact/actions.ts` |
| C3 | Add magic-byte validation to admin image uploads | `lib/storage/validate-admin-image-upload.ts` |
| C4 | Delete dead debug files | `lib/auth/callback-debug.ts`, `lib/auth/middleware-debug.ts` |

## Fix in First Sprint Post-Launch

| # | Issue | File |
|---|---|---|
| H1 | Pin image remotePatterns to own Supabase hostname | `next.config.ts` |
| H2 | Add `server-only` to admin-gate.ts and session.ts | `lib/auth/admin-gate.ts`, `lib/auth/session.ts` |
| H3 | Batch comment deletes with `.in()` | `app/articles/comment-actions.ts` |
| H4 | Validate Google OAuth username uniqueness on upsert | `lib/auth/ensure-profile.ts` |
| H5 | Harden service role key (throw if missing, not silent fallback) | `lib/supabase/admin.ts` |

---

## What Is Working Well

**RLS Coverage:** Every table queried in the app has Row Level Security enabled. The migrations confirm policies for `profiles`, `posts`, `comments`, `tags`, `podcasts`, `post_tags`. The `profiles_public` view correctly exposes only safe columns to the public.

**Security Trigger:** `profiles_enforce_role_change_trg` — a BEFORE UPDATE trigger — blocks any attempt to escalate a user's role to `admin` via a normal UPDATE. Role changes must go through the service-role client, which means only server-side privileged code can promote users.

**Admin Gate Double-Check:** The admin layout (`app/admin/layout.tsx`) calls `evaluateAdminGate()` to protect the entire admin tree. Each individual server action also calls `evaluateAdminGate()` independently. This defense-in-depth means a middleware bypass or layout rendering error doesn't grant admin access to actions.

**Magic-Byte Sniff on User Avatars:** `sniffAvatarBytes` reads the first 12 bytes of uploaded files to verify the actual file format, not just the stated MIME type. This is the correct approach and should be extended to admin uploads.

**Comment Rate Limiting:** The 5-comments-per-60-seconds limit is checked against the live database, making it effective across multiple browser tabs, devices, and server restarts. The 250-character limit is enforced at the DB level via a CHECK constraint, so it can't be bypassed by a direct API call.

**Auth Session Security:** `getSessionUser()` uses `supabase.auth.getUser()` (server-to-Supabase verification) rather than `getSession()` (trust-the-cookie), which means session tokens are always re-validated against Supabase's auth server. This is the recommended pattern.
