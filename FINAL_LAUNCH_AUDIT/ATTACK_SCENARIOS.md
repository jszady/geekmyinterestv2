# Attack Scenarios — Pre-Launch Audit

Concrete attack paths an adversary could walk through against the current codebase. Each scenario is rated by likelihood (how easy to attempt) and impact (what the attacker gains).

---

## Scenario 1: Contact Form Email Bomb

**Likelihood:** High — trivially scriptable  
**Impact:** High — operational disruption, Resend account suspension, inbox flooding  
**Blocked by current code:** Partially (honeypot only)

**Attack steps:**
1. Attacker opens browser DevTools or writes a simple Python script.
2. Discovers the contact form submits to a Next.js Server Action via POST.
3. Sends 1,000 POST requests per minute with `bot_trap=""` and valid form data.
4. Each request triggers `dispatchContactInquiry` which calls the Resend API.
5. Resend free tier (100 emails/day) exhausted in < 1 minute. Paid tier costs mount. `CONTACT_TO_EMAIL` inbox floods.

**Why honeypot fails:** Any HTTP client that doesn't render HTML (curl, Python requests, etc.) simply omits the `bot_trap` field — which evaluates to empty string — passing the check.

**Fix:** IP-based rate limiting at Edge middleware (Vercel KV or Upstash Redis).

---

## Scenario 2: Clickjacking Admin Actions

**Likelihood:** Medium — requires social engineering  
**Impact:** High — admin publishes/deletes posts without knowing  
**Blocked by current code:** Not at all (no X-Frame-Options)

**Attack steps:**
1. Attacker hosts a page with a transparent `<iframe src="https://geekmyinterest.com/admin">` overlaid on an attractive decoy.
2. Tricks an authenticated admin into clicking on the decoy (a fake "Win a prize" button).
3. The click lands on the admin post-publish button inside the invisible iframe.
4. Supabase session cookie is sent (same-site), post is published/deleted.

**Fix:** `X-Frame-Options: DENY` header in `next.config.ts`.

---

## Scenario 3: Admin Image Upload — Malicious File

**Likelihood:** Low (requires admin credentials)  
**Impact:** High — stored XSS or webshell if served with executable content type  
**Blocked by current code:** Partially (extension + MIME type check, no magic bytes)

**Attack steps:**
1. Attacker obtains admin credentials (phishing, credential stuffing, insider).
2. Creates an SVG file containing `<script>alert(document.cookie)</script>`.
3. Renames it to `cover.jpg`. Sets Content-Type to `image/jpeg` before uploading.
4. The extension check passes (`.jpg`), the MIME check passes (`image/jpeg` stated).
5. File is stored in Supabase Storage. If the bucket serves it with `Content-Type: image/svg+xml` (Supabase auto-detects), browsers execute the embedded script when the URL is visited.
6. Any user viewing a post with this cover image is XSS'd. Admin cookies stolen.

**Fix:** Read first 12 bytes; reject files whose magic bytes don't match a known image format.

---

## Scenario 4: Comment Spam Burst

**Likelihood:** High  
**Impact:** Medium — article comment section flooded, DB rows polluted  
**Blocked by current code:** Mostly (5/60s rate limit), but exploitable at window boundary

**Attack steps:**
1. Attacker authenticates with a real account.
2. At T=0s, posts 5 comments (hits limit).
3. At T=60.1s, posts 5 more (new window opened, limit resets).
4. Automated script repeats: 5 comments per minute = 300 per hour = 7,200 per day.
5. All pass the rate limit check because the window always has < 5 in the last 60 seconds.

**Fix:** Add a daily cap per user (`WHERE created_at > NOW() - INTERVAL '24 hours'`), and consider a per-article limit.

---

## Scenario 5: Username Takeover via Timing Race

**Likelihood:** Low — requires coordination  
**Impact:** Medium — user impersonation, brand confusion  
**Blocked by current code:** Mostly (uniqueness check before update), but no transaction

**Attack steps:**
1. Attacker and victim both submit profile completion with username "geekmaster" simultaneously.
2. Both pass the uniqueness pre-check (table read returns 0 rows for that username).
3. Both proceed to the UPDATE.
4. The DB `UNIQUE` constraint on `profiles.username` rejects the second UPDATE with error code `23505`.
5. The code handles this by returning "Username already taken" — no data is corrupted.

**Current status:** This is handled correctly at the DB level (the unique constraint catches it). The pre-check race is not a real vulnerability because the DB constraint is the real gate. The scenario is included because the error message may confuse users who submitted a username that was available when they checked.

**Recommendation:** Retry the uniqueness check on `23505` error and return a user-facing message suggesting alternative usernames.

---

## Scenario 6: Session Fixation via OAuth Account Linking

**Likelihood:** Low  
**Impact:** High — account takeover if email collision is possible  
**Blocked by current code:** Partially

**Attack steps:**
1. Attacker knows victim's email address.
2. Attacker registers a normal email/password account with victim's email.
3. Victim attempts to sign in via Google OAuth (same email).
4. `ensureProfileRowForUser` detects `email_conflict` and calls `signOut()` — this is the correct defensive response.
5. However: if Supabase's identity linking is enabled on the project, step 2 and 3 might link the attacker's password credentials to the victim's Google account.

**Current status:** The `email_conflict` check in `signInAction` and the `ensureProfileRowForUser` return value correctly reject the conflicting sign-in. Whether Supabase's identity linking is enabled depends on the project dashboard setting, which is outside the codebase.

**Recommendation:** Verify in the Supabase dashboard that "Allow multiple auth methods for same email" is set appropriately for your threat model. If you want strict email isolation, disable automatic identity linking.

---

## Scenario 7: SSRF via Image URL Fields (Admin)

**Likelihood:** Low (requires admin)  
**Impact:** Low-Medium — internal network probing if Vercel/Supabase infra is on same network  
**Blocked by current code:** Not at all

**Attack steps:**
1. Compromised or malicious admin enters `http://169.254.169.254/latest/meta-data/` as a post cover image URL.
2. If Next.js `<Image>` component fetches that URL server-side during optimization, the response is returned to the attacker's browser.
3. On Vercel, this metadata endpoint may not be accessible, but on other hosting it could expose cloud credentials.

**Fix:** Validate admin-entered image URLs: require `https://` scheme, reject RFC 1918 / link-local addresses, or restrict to the allowlisted hostname patterns from `next.config.ts`.
