# Critical Blockers — Pre-Launch Audit

Issues that **must** be fixed before going live. Any one of these can be exploited immediately or causes data exposure.

---

## 1. Missing Security Headers

**Severity:** Critical  
**Files:** `next.config.ts`

The app ships no HTTP security headers. There is no Content-Security-Policy, no `X-Frame-Options`, no `X-Content-Type-Options`, and no `Referrer-Policy`. This means:

- The site is vulnerable to clickjacking (no `X-Frame-Options: DENY`).
- Browsers will MIME-sniff responses (no `X-Content-Type-Options: nosniff`).
- Admin pages can be embedded in attacker-controlled iframes.
- XSS payloads are not blocked by any CSP layer.

**Fix:** Add a `headers()` export to `next.config.ts`:

```ts
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // tighten after audit
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self'",
            "connect-src 'self' https://*.supabase.co",
            "frame-ancestors 'none'",
          ].join("; "),
        },
      ],
    },
  ];
},
```

---

## 2. No Rate Limiting on Contact Form

**Severity:** Critical  
**Files:** `app/contact/actions.ts`, `lib/contact/dispatch-inquiry.ts`

The contact form server action has only a honeypot field as bot protection. A bot that discovers the endpoint can:

- Flood the Resend account with thousands of outbound emails (hitting the free-tier limit within minutes).
- Cause the `CONTACT_TO_EMAIL` inbox to be spam-flagged, breaking legitimate contact.
- Incur Resend API costs on a paid plan.

The honeypot (`bot_trap` field) is trivially bypassed by any headless browser or form-aware scraper.

**Fix (minimal, no new infra):** Add IP-based rate limiting using Vercel's `waitUntil` + an in-memory or Edge KV store, or use Vercel's built-in request rate limiting at the edge. At minimum, add a server-side check:

```ts
// In submitContactForm — use a simple in-memory LRU or Upstash Redis
const ip = headers().get("x-forwarded-for") ?? "unknown";
if (await isRateLimited(ip, { max: 5, windowSeconds: 300 })) {
  return { ok: false, error: "Too many requests. Please try again later." };
}
```

Alternatively, protect the route with Vercel's Edge Middleware rate limiting.

---

## 3. Admin Image Uploads Lack Magic-Byte Validation

**Severity:** Critical  
**Files:** `lib/storage/validate-admin-image-upload.ts`, `app/admin/post-actions.ts`, `app/admin/podcast-actions.ts`

Admin image uploads check the file's MIME type (from the `Content-Type` header or `file.type`) and extension, but **do not read the actual file bytes** to verify the file is really an image.

An attacker with admin credentials (or a compromised admin session) can:

1. Rename a malicious file (e.g., an SVG with embedded XSS, a PHP/JS webshell) to `.jpg`.
2. Set `Content-Type: image/jpeg`.
3. Upload it to Supabase Storage.
4. If the storage bucket is public and the CDN serves it with the original content type or the browser sniffs it, XSS executes.

The avatar upload path (`lib/profile/signup-storage-avatar.ts`) already uses `sniffAvatarBytes` — this validation is missing from the admin upload path.

**Fix:** Apply the same magic-byte sniffing to `validateAdminImageUpload`:

```ts
import { sniffAvatarBytes } from "@/lib/profile/sniff-avatar-bytes";

export async function validateAdminImageUpload(file: File): Promise<ValidationResult> {
  // ... existing checks ...

  const buffer = await file.slice(0, 12).arrayBuffer();
  const sniff = sniffAvatarBytes(new Uint8Array(buffer));
  if (!sniff.ok) {
    return { ok: false, error: "File content does not match an allowed image type." };
  }

  return { ok: true };
}
```

---

## 4. Dead Code Files Expose Debug Tooling

**Severity:** High-Critical  
**Files:** `lib/auth/callback-debug.ts`, `lib/auth/middleware-debug.ts`

These two files exist on disk but all imports have been removed. They contain logging helpers that previously printed auth session data, redirect targets, and profile lookup results. While they're not currently called, they:

- Add confusion about the actual auth flow.
- Could be accidentally re-imported during future development.
- May contain sensitive function signatures or data structures that help an attacker understand the system.

**Fix:** Delete both files.

```bash
rm lib/auth/callback-debug.ts lib/auth/middleware-debug.ts
```
