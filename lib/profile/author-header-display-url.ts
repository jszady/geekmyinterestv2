import "server-only";

import { authorHeaderImageObjectPathFromPublicUrl } from "@/lib/profile/avatar-upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getNextPublicSupabaseUrl } from "@/lib/supabase/public-env";

const BUCKET = "author-headers";

function isDisallowedBucketUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("/object/public/profile-images/") ||
    lower.includes("/object/public/post-images/") ||
    lower.includes("/object/public/podcast-images/")
  );
}

function authorHeadersInUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("/object/public/author-headers/") ||
    lower.includes("/object/sign/author-headers/") ||
    lower.includes("/render/image/public/author-headers/")
  );
}

function normalizeObjectPath(raw: string): string | null {
  let path = raw.replace(/^\/+/, "").trim();
  if (!path || path.includes("..")) return null;
  if (path.startsWith(`${BUCKET}/`)) {
    path = path.slice(BUCKET.length + 1);
  }
  if (!path) return null;
  return path;
}

export type AuthorHeaderStoredKind =
  | "empty"
  | "full_url"
  | "relative_storage_path"
  | "storage_object_path";

export function classifyAuthorHeaderStored(
  stored: string | null | undefined,
): { kind: AuthorHeaderStoredKind; raw: string } {
  const raw = (stored ?? "").trim();
  if (!raw) return { kind: "empty", raw: "" };
  if (raw.startsWith("https://") || raw.startsWith("http://")) {
    return { kind: "full_url", raw };
  }
  if (raw.startsWith("/storage/v1/")) {
    return { kind: "relative_storage_path", raw };
  }
  return { kind: "storage_object_path", raw };
}

/** Strip invisible chars that break `<img src>` while leaving the URL otherwise unchanged. */
function stripUrlNoise(s: string): string {
  return s.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

/**
 * Bucket-relative object path for Storage remove(), from any legacy `author_header_image` shape
 * (full public URL, `/storage/v1/...` relative URL, or `{userId}/...` object path).
 */
export function authorHeaderStoredToObjectPath(stored: string | null | undefined): string | null {
  const cleanedStored = stripUrlNoise(stored ?? "");
  if (!cleanedStored) return null;

  const { kind, raw } = classifyAuthorHeaderStored(cleanedStored);
  if (kind === "empty") return null;

  if (kind === "full_url") {
    return authorHeaderImageObjectPathFromPublicUrl(raw);
  }

  if (kind === "relative_storage_path") {
    const base = getNextPublicSupabaseUrl()?.replace(/\/$/, "");
    if (!base) return null;
    const joined = `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
    return authorHeaderImageObjectPathFromPublicUrl(joined);
  }

  return normalizeObjectPath(raw);
}

/**
 * Resolves `profiles_public.author_header_image` to a browser URL.
 * - Full URLs under `author-headers` → use as-is (after validation).
 * - Paths like `{userId}/...` → `supabase.storage.from("author-headers").getPublicUrl(path)`.
 * - Relative `/storage/v1/object/public/author-headers/...` → prepend `NEXT_PUBLIC_SUPABASE_URL`.
 */
export async function resolveAuthorHeaderImageForDisplay(
  stored: string | null | undefined,
): Promise<string | null> {
  const cleanedStored = stripUrlNoise(stored ?? "");
  if (!cleanedStored) return null;

  const { kind, raw } = classifyAuthorHeaderStored(cleanedStored);

  if (kind === "empty") {
    return null;
  }

  if (kind === "full_url") {
    const rawClean = stripUrlNoise(raw);
    if (isDisallowedBucketUrl(rawClean) || !authorHeadersInUrl(rawClean)) {
      return null;
    }

    const lower = rawClean.toLowerCase();
    let displayUrl = rawClean;
    if (
      lower.includes("/object/sign/author-headers/") ||
      lower.includes("/render/image/public/author-headers/")
    ) {
      const objectPath = authorHeaderImageObjectPathFromPublicUrl(rawClean);
      if (objectPath) {
        const supabase = await createSupabaseServerClient();
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
        const pub = data.publicUrl?.trim();
        if (pub) displayUrl = pub;
      }
    }

    try {
      new URL(displayUrl);
    } catch {
      return null;
    }
    if (isDisallowedBucketUrl(displayUrl) || !authorHeadersInUrl(displayUrl)) {
      return null;
    }
    return displayUrl;
  }

  if (kind === "relative_storage_path") {
    const base = getNextPublicSupabaseUrl()?.replace(/\/$/, "");
    if (!base) return null;
    const joined = `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
    if (isDisallowedBucketUrl(joined) || !authorHeadersInUrl(joined)) {
      return null;
    }
    return joined;
  }

  const objectPath = normalizeObjectPath(raw);
  if (!objectPath) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl?.trim() || null;
}
