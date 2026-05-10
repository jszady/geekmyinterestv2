import { sniffAvatarBytes } from "@/lib/profile/avatar-upload";
import type { AvatarMime } from "@/lib/profile/avatar-upload";

/** Max size for admin post / podcast image uploads (5MB). */
export const ADMIN_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

/** Extensions that must never be accepted (even if MIME is spoofed). */
const BLOCKED_EXT = new Set([
  "svg",
  "svgz",
  "html",
  "htm",
  "xhtml",
  "js",
  "mjs",
  "cjs",
  "php",
  "phtml",
  "exe",
  "dll",
  "bat",
  "cmd",
  "com",
  "sh",
]);

const MIME_TO_EXT = new Map<string, Set<string>>([
  ["image/jpeg", new Set(["jpg", "jpeg"])],
  ["image/png", new Set(["png"])],
  ["image/webp", new Set(["webp"])],
  ["image/gif", new Set(["gif"])],
]);

function extensionFromFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot < 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

function gifMagicBytesValid(buf: Uint8Array): boolean {
  // GIF87a = 47 49 46 38 37 61 / GIF89a = 47 49 46 38 39 61
  return (
    buf.length >= 6 &&
    buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 &&
    buf[3] === 0x38 && (buf[4] === 0x37 || buf[4] === 0x39) && buf[5] === 0x61
  );
}

export type AdminImageUploadValidation =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Validates admin image uploads before Supabase Storage: type, extension, size, and magic bytes.
 * Call only when a non-empty `File` is present.
 */
export async function validateAdminImageUpload(file: File): Promise<AdminImageUploadValidation> {
  if (file.size > ADMIN_IMAGE_UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      error: `Image must be 5MB or smaller (this file is ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  const ext = extensionFromFileName(file.name);
  if (BLOCKED_EXT.has(ext)) {
    return {
      ok: false,
      error:
        "This file type is not allowed. Only JPG, PNG, WebP, and GIF images may be uploaded.",
    };
  }

  if (!ALLOWED_EXT.has(ext)) {
    return {
      ok: false,
      error: "Only JPG, PNG, WebP, and GIF images are allowed.",
    };
  }

  const mime = (file.type ?? "").trim().toLowerCase();

  if (mime && mime !== "application/octet-stream") {
    if (!ALLOWED_MIME.has(mime)) {
      return {
        ok: false,
        error: "Invalid image type. Use JPG, PNG, WebP, or GIF only.",
      };
    }
    const allowedForMime = MIME_TO_EXT.get(mime);
    if (allowedForMime && !allowedForMime.has(ext)) {
      return {
        ok: false,
        error: "File extension does not match the image type.",
      };
    }
  }

  // Resolve the effective MIME for magic-byte checking when file.type is absent/generic.
  let effectiveMime = mime && mime !== "application/octet-stream" ? mime : null;
  if (!effectiveMime) {
    if (ext === "jpg" || ext === "jpeg") effectiveMime = "image/jpeg";
    else if (ext === "png") effectiveMime = "image/png";
    else if (ext === "webp") effectiveMime = "image/webp";
    else if (ext === "gif") effectiveMime = "image/gif";
  }

  if (
    effectiveMime === "image/jpeg" ||
    effectiveMime === "image/png" ||
    effectiveMime === "image/webp"
  ) {
    const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const valid = await sniffAvatarBytes(buf, effectiveMime as AvatarMime);
    if (!valid) {
      return {
        ok: false,
        error: "File content does not match a valid image format.",
      };
    }
  } else if (effectiveMime === "image/gif") {
    const buf = new Uint8Array(await file.slice(0, 6).arrayBuffer());
    if (!gifMagicBytesValid(buf)) {
      return {
        ok: false,
        error: "File content does not match a valid image format.",
      };
    }
  }

  return { ok: true };
}
