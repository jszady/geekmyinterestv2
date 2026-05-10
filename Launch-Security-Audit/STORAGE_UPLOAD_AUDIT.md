# Storage Upload Audit

---

## Upload Architecture

Two upload paths exist:

1. **Post images** — `uploadImageField()` in `app/admin/post-actions.ts` → bucket `post-images`
2. **Podcast thumbnail** — `uploadThumbnail()` in `app/admin/podcast-actions.ts` → bucket `podcast-images`

Both paths:
- Are inside `requireAdmin()` — non-admins cannot reach them
- Call `validateAdminImageUpload(file)` from `lib/storage/validate-admin-image-upload.ts` before any upload

---

## `validateAdminImageUpload()` — Full Analysis

**File:** `lib/storage/validate-admin-image-upload.ts`

### Allowed MIME types
```typescript
const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
]);
```

### Allowed extensions
```typescript
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
```

### Explicitly blocked extensions (even if MIME is spoofed)
```typescript
const BLOCKED_EXT = new Set([
  "svg", "svgz", "html", "htm", "xhtml",
  "js", "mjs", "cjs",
  "php", "phtml",
  "exe", "dll", "bat", "cmd", "com", "sh",
]);
```

### MIME-to-extension cross-check
```typescript
const MIME_TO_EXT = new Map([
  ["image/jpeg", new Set(["jpg", "jpeg"])],
  ["image/png", new Set(["png"])],
  ["image/webp", new Set(["webp"])],
  ["image/gif", new Set(["gif"])],
]);
```

A file with `image/jpeg` MIME type but `.png` extension will be rejected: "File extension does not match the image type."

### Size limit
```typescript
export const ADMIN_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5MB
```

### Validation order
1. Size check (> 5MB → rejected)
2. Extension extracted from filename
3. BLOCKED_EXT check (explicit deny — runs even if MIME is fine)
4. ALLOWED_EXT check
5. MIME type check (skipped if `file.type` is empty or `application/octet-stream` — browser couldn't determine type)
6. MIME-to-extension consistency check

**Assessment: COMPREHENSIVE.** This is a well-written validation function.

### One gap: MIME type is skipped when empty or `application/octet-stream`

```typescript
const mime = (file.type ?? "").trim().toLowerCase();
if (mime && mime !== "application/octet-stream") {
  if (!ALLOWED_MIME.has(mime)) { ... }
```

If `file.type` is empty string or `"application/octet-stream"`, the MIME validation is skipped entirely and the extension check alone decides. A renamed `.jpg` file that is actually a PHP script would pass — but only if it has a `.jpg` extension, which is technically fine for storage purposes since the bucket serves with the content type it infers from the actual bytes.

The blocked extension list provides a strong secondary defense. A file named `malware.svg` still gets rejected regardless of MIME. SVG files are blocked.

**Severity of the skip:** LOW. Extension validation is the primary guard and it's solid.

---

## What Checks Pass / Fail

| Check | Status | Notes |
|-------|--------|-------|
| Admin-only gate | PASS | `requireAdmin()` wraps all upload functions |
| 5MB size limit | PASS | Checked before upload |
| SVG files blocked | PASS | `"svg"` in `BLOCKED_EXT` |
| HTML/JS files blocked | PASS | All in `BLOCKED_EXT` |
| PHP files blocked | PASS | `"php"`, `"phtml"` in `BLOCKED_EXT` |
| MIME + extension consistency | PASS | `MIME_TO_EXT` cross-check |
| Path traversal via filename | PASS | `file.name.replace(/[^\w.\-]+/g, "_")` strips `../` sequences |
| `upsert: false` (no overwrite) | PASS | Prevents clobbering existing files |
| Max path length | PASS | `.slice(0, 80)` on sanitized filename |
| Bucket-level MIME restrictions | **UNKNOWN** | Dashboard setting, not in code — verify |

---

## Storage RLS

Covered by `006_rls_storage.sql`. INSERT requires admin role. Public SELECT for serving images.

**One assumption to verify:** The policies in `006_rls_storage.sql` use `bucket_id = 'post-images'` and `bucket_id = 'podcast-images'`. These must exactly match the bucket IDs created in the Supabase Storage dashboard. If the buckets were named differently (e.g., `post_images` with underscore), the INSERT policy silently allows uploads from any authenticated user because no policy matches the bucket, and Supabase's default for unmatched buckets is to deny. Wait — actually Supabase's default when RLS is enabled but no matching policy exists is to **deny**. So a mismatched bucket name means uploads fail entirely, not that they become unrestricted. Verify bucket names match.

---

## Server-Side vs Client-Side Upload

Both upload paths go through Next.js Server Actions (`"use server"` files). The browser never talks directly to Supabase Storage. The anon JWT from the browser session is used to authenticate the server-side upload, but the admin role check happens in the server action before any upload is attempted.

This means: even if a user somehow crafted a request to the server action endpoint with a malicious file, `requireAdmin()` would block it before `validateAdminImageUpload()` is even called.

---

## Old Images Not Deleted on Update

When a post is updated with a new card image, `uploadImageField` uploads the new file. The old file's path is replaced in the DB. The old file in storage is **not deleted** unless the `removeStoragePaths` function is called explicitly.

Looking at `updatePostAction`:
```typescript
const newCard = await uploadImageField(supabase, userId, formData, "card_image");
if (newCard) card = newCard;
// old card image path is silently abandoned in storage
```

`removeStoragePaths` is called during `deletePostAction` (when a post is deleted), but NOT during updates. Images accumulate indefinitely on every post update.

**Impact:** Storage quota increases over time. Not a security issue but a reliability/cost issue at scale.

**Fix:** On update, if `newCard` is different from the existing `row.card_image`, call `removeStoragePaths(supabase, [row.card_image])` after the update succeeds.

---

## Summary

Storage upload security is in good shape. The validation function is thorough. The main remaining issues are:

1. Verify bucket IDs in the dashboard match the names in `006_rls_storage.sql`
2. Verify dashboard-level MIME type restrictions are set (secondary layer to app validation)
3. Old images are not cleaned up on update (cost/storage issue, not security)
