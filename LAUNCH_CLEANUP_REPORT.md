# Launch Cleanup Report

Summary of all debug code removal and code quality work performed before launch.

---

## Debug Logging Removed

### `lib/auth/session.ts`
- Removed `logAuth` helper function
- Removed 5 `logAuth(...)` call sites throughout the session/profile resolution flow
- Removed dev-only `console.warn` about missing service role key

### `lib/auth/admin-gate.ts`
- Removed `import type { ProfileRow }` (was only used in a debug log)
- Removed two `process.env.NODE_ENV === "development"` debug blocks logging admin gate evaluation results

### `lib/supabase/public-env.ts`
- Removed dev-only block logging `NEXT_PUBLIC_SUPABASE_URL` and anon key presence

### `lib/contact/dispatch-inquiry.ts`
- Removed `contactDevLog` helper function and all 6 call sites
- Removed `console.info` for missing Resend configuration
- Retained `console.error` calls for actual send failures (legitimate production error logs)

### `lib/auth/ensure-profile.ts`
- Removed dev-only `console.log` on successful profile insertion

### `lib/profile/author-header-display-url.ts`
- Removed `logAuthorHeaderDebug` function and all call sites across the resolver branches
- Removed `context?: { username?: string }` parameter from `resolveAuthorHeaderImageForDisplay`
- Removed two `console.warn` calls

### `app/auth/actions.ts`
- Removed debug logs for signup username availability check
- Removed debug log for supabase signUp response object
- Removed redundant `console.error` for error object (error is returned to caller)
- Removed dev-only logs for complete-profile submitted/cleaned username
- Removed dev-only log for current user id
- Removed dev-only log for complete-profile update response

### `app/auth/callback/route.ts`
- Removed `import { logAuthCallback } from "@/lib/auth/callback-debug"`
- Removed all 4 `logAuthCallback({...})` call sites
- Simplified profile query to drop unused `error` destructure variable

### `app/complete-profile/page.tsx`
- Removed `import { logAuthMiddleware } from "@/lib/auth/middleware-debug"`
- Removed all 3 `logAuthMiddleware({...})` calls
- Removed unused `const pathname = "/complete-profile"` variable

### `app/contact/actions.ts`
- Removed duplicate `contactDevLog` function definition
- Removed all 5 `contactDevLog(...)` call sites
- Removed `// TEMP debug` block logging Resend env var presence

### `app/account/settings/actions.ts`
- Removed two `console.log` debug upload summary calls

### `components/auth/CompleteProfileForm.tsx`
- Removed 8 `console.log`/`console.error` debug calls throughout the form submission flow
- Removed deprecated `FormEvent` import (React 19)
- Fixed onSubmit handler signature to use structural type instead of deprecated generic

### `components/contact/ContactHub.tsx`
- Removed dev-only `console.log` in form `onSubmit` handler

### `components/authors/AuthorHeaderImage.tsx`
- Removed `onLoad`/`onError` debug handlers from the `<img>` element

### `middleware.ts`
- Removed `import { logAuthMiddleware } from "@/lib/auth/middleware-debug"`
- Removed all 3 `logAuthMiddleware({...})` call sites

---

## Bug Fixes Applied During Cleanup

### Author Header Upload Path (Critical Bug Fix)
**File:** `app/account/settings/actions.ts`

The upload path was missing the user ID prefix required by the Supabase Storage bucket RLS INSERT policy (`(storage.foldername(name))[1] = (auth.uid())::text`). Uploads were being attempted without the `{userId}/` prefix, causing silent RLS rejections.

**Before:** `${Date.now()}-author-header-${safeName}`  
**After:** `${user.id}/${Date.now()}-author-header-${safeName}`

The saved DB value is now `uploaded.path` (the confirmed path from Supabase's response) rather than a reconstructed string from helper functions.

Removed `authorHeaderUploadResponseObjectKey` and `authorHeaderBucketRelativeFromObjectKey` helper functions that were doing complex and incorrect path extraction.

### Author Page Rendering Fix
**Files:** `components/authors/AuthorProfileView.tsx`, `components/authors/AuthorHeaderImage.tsx`

- Created `AuthorHeaderImage` as a `"use client"` component to handle the image element in a server component tree
- Removed amber debug banner showing raw header image URL state
- Removed `.trim()` guards on the prop value (stored paths are already clean)
- Removed debug fallback logic

### Resolver Parameter Cleanup
**Files:** `lib/profile/author-header-display-url.ts`, `app/authors/[username]/page.tsx`, `app/account/settings/page.tsx`

After removing the `context` parameter from `resolveAuthorHeaderImageForDisplay`, updated both call sites to not pass the now-deleted argument.

---

## Dead Code Identified (Not Yet Deleted)

These files exist on disk but have no callers — all imports were removed during cleanup:

- `lib/auth/callback-debug.ts` — auth callback debug logging helpers
- `lib/auth/middleware-debug.ts` — middleware auth debug logging helpers

**Action required:** Delete both files before launch.

---

## Code Quality Changes

| File | Change |
|---|---|
| `components/auth/CompleteProfileForm.tsx` | Removed deprecated `FormEvent` import; fixed handler type |
| `lib/profile/author-header-display-url.ts` | Removed unused `context` parameter |
| `app/auth/callback/route.ts` | Removed unused `profileErr` destructure variable |
| `app/complete-profile/page.tsx` | Removed unused `pathname` variable |
| `lib/auth/admin-gate.ts` | Removed unused `ProfileRow` type import |
| `components/auth/CompleteProfileForm.tsx` | Changed `.select("id, username")` to `.select("id")` (username was only used in debug log) |
