/**
 * Absolute site URL for metadata, sitemaps, auth email redirects, and canonical links.
 *
 * Order: `NEXT_PUBLIC_SITE_URL` (trimmed, no trailing slash) → production default
 * `https://geekmyinterest.com` when `NODE_ENV === "production"` → `http://localhost:3000`
 * in development if env is unset (local docs / `.env.example` still recommend setting the env var).
 *
 * Does not use `NEXT_PUBLIC_*` for secrets. Supabase project URL is unchanged elsewhere.
 */
const PRODUCTION_SITE = "https://geekmyinterest.com";
const DEV_FALLBACK = "http://localhost:3000";

export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "production" ? PRODUCTION_SITE : DEV_FALLBACK;
}
