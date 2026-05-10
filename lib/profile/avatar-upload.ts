const MAX_BYTES = 2 * 1024 * 1024;
const AUTHOR_HEADER_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export type AvatarMime = "image/jpeg" | "image/png" | "image/webp";

export function assertAvatarFile(file: File): { ok: true; mime: AvatarMime } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "Choose an image file." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be 2MB or smaller." };
  }
  const type = (file.type || "").toLowerCase().trim();
  if (!ALLOWED_MIME.has(type)) {
    return { ok: false, error: "Use JPEG, PNG, or WebP only (no SVG, GIF, or other formats)." };
  }
  return { ok: true, mime: type as AvatarMime };
}

/** Author page banner uploads: same types as avatars, larger size limit. */
export function assertAuthorHeaderFile(
  file: File,
): { ok: true; mime: AvatarMime } | { ok: false; error: string } {
  if (!file || file.size === 0) {
    return { ok: false, error: "Choose an image file." };
  }
  if (file.size > AUTHOR_HEADER_MAX_BYTES) {
    return { ok: false, error: "Header image must be 5MB or smaller." };
  }
  const type = (file.type || "").toLowerCase().trim();
  if (!ALLOWED_MIME.has(type)) {
    return { ok: false, error: "Use JPEG, PNG, or WebP only (no SVG, GIF, or other formats)." };
  }
  return { ok: true, mime: type as AvatarMime };
}

/** Sniff magic bytes; must match claimed JPEG/PNG/WebP. */
export async function sniffAvatarBytes(
  buffer: Uint8Array,
  claimed: AvatarMime,
): Promise<boolean> {
  if (buffer.length < 12) return false;
  const b = buffer;
  if (claimed === "image/png") {
    return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  }
  if (claimed === "image/jpeg") {
    return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  }
  if (claimed === "image/webp") {
    const riff = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
    const webp = b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    return riff && webp;
  }
  return false;
}

export function safeAvatarFilename(originalName: string, mime: AvatarMime): string {
  const base = (originalName.split(/[/\\]/).pop() ?? "avatar").trim() || "avatar";
  const dot = base.lastIndexOf(".");
  const stem = (dot > 0 ? base.slice(0, dot) : base).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80);
  const ext =
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return `${stem || "avatar"}.${ext}`;
}

export function profileImageObjectPathFromPublicUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const marker = "/storage/v1/object/public/profile-images/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

/** Object path inside bucket `author-headers` from a public (or signed) object URL. */
export function authorHeaderImageObjectPathFromPublicUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const markers = [
      "/storage/v1/object/public/author-headers/",
      "/storage/v1/object/sign/author-headers/",
      "/storage/v1/render/image/public/author-headers/",
    ];
    for (const marker of markers) {
      const idx = u.pathname.indexOf(marker);
      if (idx !== -1) {
        return decodeURIComponent(u.pathname.slice(idx + marker.length).split("?")[0] ?? "");
      }
    }
    return null;
  } catch {
    return null;
  }
}
