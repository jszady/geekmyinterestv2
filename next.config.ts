import "./lib/load-env-bootstrap";
import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getNextPublicSupabaseUrl } from "./lib/supabase/public-env";

/** This app lives inside a parent folder that also has a lockfile; pin the root so dev/build use this project. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

function supabaseStorageRemotePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | null {
  const raw = getNextPublicSupabaseUrl();
  if (!raw) return null;
  try {
    const hostname = new URL(raw).hostname;
    return {
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return null;
  }
}

const supabasePattern = supabaseStorageRemotePattern();

/** Production project storage — explicit so Next/Image works even if env is missing at config eval. */
const supabaseAuthorHeadersPattern = {
  protocol: "https" as const,
  hostname: "hmhzyrdjhmeelxsqlury.supabase.co",
  pathname: "/storage/v1/object/public/author-headers/**",
};

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------

// Supabase hostname for CSP connect-src / img-src.
const supabaseHostname = (() => {
  const raw = getNextPublicSupabaseUrl();
  if (!raw) return null;
  try { return new URL(raw).hostname; } catch { return null; }
})();

// Build connect-src: always allow self + Supabase (http + ws) + Google auth.
const connectSrc = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://accounts.google.com",
  ...(supabaseHostname ? [`https://${supabaseHostname}`, `wss://${supabaseHostname}`] : []),
].join(" ");

// Build img-src: allow self, data URIs, blobs, and HTTPS image origins.
const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https:",
].join(" ");

// CSP notes:
// - script-src includes 'unsafe-inline' because Next.js App Router inlines hydration
//   scripts and chunk bootstraps that cannot be removed without a nonce setup.
// - script-src includes 'unsafe-eval' because Next.js development mode requires it.
//   In production, Next.js does NOT need 'unsafe-eval', but it is left here to avoid
//   a hard-to-debug breakage if any third-party library relies on it. Remove it once
//   you have confirmed production works without it.
// - style-src includes 'unsafe-inline' because Tailwind + Next.js both inject inline styles.
// - frame-src allows Google OAuth popup and YouTube embeds.
// - frame-ancestors 'none' prevents the site from being embedded in any iframe.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${imgSrc}`,
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://accounts.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // HSTS: tell browsers to use HTTPS for 1 year. Only takes effect over HTTPS,
  // so it is safe to send in all environments.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      ...(supabasePattern ? [supabasePattern] : []),
      supabaseAuthorHeadersPattern,
    ],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
