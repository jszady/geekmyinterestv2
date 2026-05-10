# Launch Readiness — Pre-Launch Audit

Go/No-Go assessment based on the full security and stability audit.

---

## Verdict: CONDITIONAL GO

The app is structurally sound and can launch, but **two items (C1 and C2) must be completed first**. Items C3 and C4 are strongly recommended before launch but won't expose users to immediate data loss or account compromise.

---

## Pre-Launch Checklist

### Blockers (must complete before go-live)

- [ ] **C1 — Add HTTP security headers**
  Add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a baseline CSP to `next.config.ts`.
  Estimated effort: 30 minutes.

- [ ] **C2 — Rate limit the contact form**
  Add IP-based rate limiting (Vercel KV, Upstash Redis, or Edge Middleware). 5 submissions per IP per 10 minutes is a reasonable starting point.
  Estimated effort: 2–4 hours.

### Strongly Recommended Before Launch

- [ ] **C3 — Magic-byte validation on admin image uploads**
  Extend `validateAdminImageUpload` to read the first 12 bytes of uploaded files and verify they match a known image format. Mirror the pattern from `sniffAvatarBytes`.
  Estimated effort: 1–2 hours.

- [ ] **C4 — Delete dead debug files**
  Remove `lib/auth/callback-debug.ts` and `lib/auth/middleware-debug.ts`. These files have no callers and exist only as noise.
  Estimated effort: 5 minutes.

### First Sprint Post-Launch (within 2 weeks)

- [ ] **H1 — Pin image remotePatterns to own Supabase hostname**
- [ ] **H2 — Add `server-only` to admin-gate.ts and session.ts**
- [ ] **H3 — Batch comment deletes with `.in()`**
- [ ] **H4 — Handle Google OAuth username collision gracefully**
- [ ] **H5 — Throw on missing SUPABASE_SERVICE_ROLE_KEY instead of silent fallback**
- [ ] **H6 — Verify `profiles` RLS SELECT policy doesn't expose email to authenticated users**

---

## Environment Checklist

Before deploying to production, confirm all these environment variables are set:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — avatar uploads will silently fail without it for email-confirmation signups |
| `NEXT_PUBLIC_SITE_URL` | Yes | Full origin (https://yourdomain.com) — used in email redirect URLs |
| `RESEND_API_KEY` | Yes | Contact form will silently fail without it |
| `CONTACT_TO_EMAIL` | Yes | Destination for contact form submissions |
| `CONTACT_FROM_EMAIL` | Yes | Sender address for contact form emails (must be a verified Resend domain) |

---

## Operational Readiness

### Monitoring
- No application-level error monitoring (Sentry, etc.) was found. Server errors are logged to the runtime (Vercel logs), which is sufficient for launch but should be upgraded.
- No uptime monitoring configured in-repo.

### Backup
- Database backup is managed by Supabase (daily backups on Pro plan). Verify backup is enabled before launch.

### Deployment
- Verify Vercel preview deployments don't share production Supabase credentials.
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is not present in any client-exposed environment variable (must not start with `NEXT_PUBLIC_`).

---

## What's Ready

The following areas are production-ready and require no further work for launch:

**Authentication:** Email/password and Google OAuth work correctly. Session validation uses server-to-Supabase token verification. Profile completion flow for OAuth users is well-handled. Email conflict detection and signout-on-conflict are in place.

**Authorization:** RLS is enabled on all tables. Admin gate is enforced in both layout and individual server actions. The role escalation security trigger is in place. The `profiles_public` view correctly hides sensitive columns from public queries.

**Content Management:** Post and podcast CRUD with admin protection. Tag picker with proper association management. Slug generation and uniqueness handling.

**Comment System:** Authenticated-only posting with rate limiting and DB-level character limit. Author can delete own comments; admins can delete any comment. Rate limit is persistent (DB-backed, not in-memory).

**Avatar Uploads:** Magic-byte validation for user avatars. Correct Supabase Storage path format matching bucket RLS INSERT policy. Graceful fallback if service role key is absent.

**Author Header Images:** Upload path fixed to satisfy bucket RLS (`{userId}/filename`). Display URL resolution is clean and handles null/empty values correctly. Client component for image rendering is isolated.

**Contact Form:** Honeypot anti-bot protection. Full server-side validation (topic, name, email, message). HTML-escaped email body generation. Resend integration.

**Code Hygiene:** All debug `console.log` calls removed from production paths. Legitimate `console.error` calls retained for operational visibility. Dead import cleanup complete.
