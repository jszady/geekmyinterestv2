import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

function trimEnv(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t ? t : undefined;
}

function isNodeRuntime(): boolean {
  return (
    typeof process !== "undefined" &&
    typeof process.env !== "undefined" &&
    Boolean(process.versions?.node)
  );
}

let didLoadForNode = false;

/**
 * Ensures `.env.local` is merged into `process.env` in the Node.js server runtime.
 * Skipped in Edge (middleware) — there we rely on Next-inlined `NEXT_PUBLIC_*` only.
 */
function ensureNodeEnvLoaded(): void {
  if (!isNodeRuntime() || didLoadForNode) return;
  didLoadForNode = true;
  const here = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(here, "..", "..");
  loadEnvConfig(projectRoot);
  loadEnvConfig(process.cwd());
}

/**
 * Read URL — use only `NEXT_PUBLIC_SUPABASE_URL` (App Router convention).
 */
export function getNextPublicSupabaseUrl(): string | undefined {
  if (isNodeRuntime()) ensureNodeEnvLoaded();
  return trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Read anon key — use only `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
 */
export function getNextPublicSupabaseAnonKey(): string | undefined {
  if (isNodeRuntime()) ensureNodeEnvLoaded();
  return trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** @deprecated Use getNextPublicSupabaseUrl — kept for next.config / middleware call sites. */
export function resolveSupabaseUrlForServer(): string | undefined {
  return getNextPublicSupabaseUrl();
}

/** @deprecated Use getNextPublicSupabaseAnonKey */
export function resolveSupabaseAnonKeyForServer(): string | undefined {
  return getNextPublicSupabaseAnonKey();
}

export function requireSupabasePublicEnvForServer(): {
  url: string;
  anonKey: string;
} {
  ensureNodeEnvLoaded();

  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonRaw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (process.env.NODE_ENV === "development") {
    // Temporary diagnostics — remove once env is confirmed stable
    console.log("[supabase-env] SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "[supabase-env] has NEXT_PUBLIC_SUPABASE_ANON_KEY:",
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    );
  }

  const url = trimEnv(urlRaw);
  const anonKey = trimEnv(anonRaw);

  if (!url || !anonKey) {
    const missing: string[] = [];
    if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    throw new Error(
      `Missing Supabase configuration: ${missing.join("; ")}. ` +
        "Set both in `.env.local` at the project root (same folder as `package.json`), then restart `next dev`.",
    );
  }
  return { url, anonKey };
}

export function requireSupabasePublicEnvForBrowser(): {
  url: string;
  anonKey: string;
} {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Add both to `.env.local` and restart `next dev` (client bundles read these at build/dev startup).",
    );
  }
  return { url, anonKey };
}
