/** Max size for admin post / podcast image uploads (5MB). */
export const ADMIN_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const INVALID_MAGIC =
  "Uploaded file is not a valid PNG/JPG/GIF/WEBP image.";

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

function readBlobAsUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const out = r.result;
      if (out instanceof ArrayBuffer) resolve(new Uint8Array(out));
      else reject(new Error("FileReader did not return ArrayBuffer"));
    };
    r.onerror = () => reject(r.error ?? new Error("FileReader failed"));
    r.readAsArrayBuffer(blob);
  });
}

/** First `maxBytes` of file; prefers `Response(blob)` for reliable reads across runtimes. */
async function readFileHead(file: File, maxBytes: number): Promise<Uint8Array> {
  const n = Math.min(maxBytes, Math.max(0, file.size));
  if (n <= 0) return new Uint8Array(0);
  const slice = file.slice(0, n);
  try {
    return new Uint8Array(await new Response(slice).arrayBuffer());
  } catch {
    // jsdom / older runtimes may reject; fall through
  }
  if (typeof slice.arrayBuffer === "function") {
    try {
      return new Uint8Array(await slice.arrayBuffer());
    } catch {
      // fall through
    }
  }
  if (typeof file.arrayBuffer === "function") {
    try {
      return new Uint8Array(await file.arrayBuffer()).subarray(0, n);
    } catch {
      // fall through
    }
  }
  if (typeof FileReader !== "undefined") {
    try {
      return await readBlobAsUint8Array(slice);
    } catch {
      // fall through
    }
  }
  return new Uint8Array(0);
}

function extensionFromFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot < 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

/** Normalize browser quirks (e.g. some stacks send `image/jpg`). */
export function normalizeAdminImageMime(mime: string): string {
  const m = mime.trim().toLowerCase();
  if (m === "image/jpg") return "image/jpeg";
  return m;
}

/** Best-effort Content-Type for Supabase Storage when `file.type` is empty or generic. */
export function adminImageContentTypeForStorage(file: File): string {
  const ext = extensionFromFileName(file.name);
  const raw = normalizeAdminImageMime((file.type ?? "").trim().toLowerCase());
  if (raw && raw !== "application/octet-stream" && ALLOWED_MIME.has(raw)) {
    return raw;
  }
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "application/octet-stream";
}

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function devLogAdminImage(message: string, meta: Record<string, unknown>) {
  if (!isDev()) return;
  console.info(`[admin-image-upload] ${message}`, meta);
}

/** JPEG: FF D8 FF */
function magicMatchesJpeg(buf: Uint8Array): boolean {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

/** PNG: 89 50 4E 47 0D 0A 1A 0A */
function magicMatchesPng(buf: Uint8Array): boolean {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

/** GIF87a / GIF89a */
function magicMatchesGif(buf: Uint8Array): boolean {
  return (
    buf.length >= 6 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  );
}

/** RIFF .... WEBP */
function magicMatchesWebp(buf: Uint8Array): boolean {
  return (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  );
}

type EffectiveImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function magicValidForClaimed(buf: Uint8Array, claimed: EffectiveImageMime): boolean {
  switch (claimed) {
    case "image/jpeg":
      return magicMatchesJpeg(buf);
    case "image/png":
      return magicMatchesPng(buf);
    case "image/webp":
      return magicMatchesWebp(buf);
    case "image/gif":
      return magicMatchesGif(buf);
    default:
      return false;
  }
}

/** What the file bytes look like (first 16 bytes); independent of extension. */
function detectMagicFormat(buf: Uint8Array): EffectiveImageMime | null {
  if (magicMatchesGif(buf)) return "image/gif";
  if (magicMatchesPng(buf)) return "image/png";
  if (magicMatchesWebp(buf)) return "image/webp";
  if (magicMatchesJpeg(buf)) return "image/jpeg";
  return null;
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

  const mime = normalizeAdminImageMime((file.type ?? "").trim().toLowerCase());

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

  let effectiveMime: EffectiveImageMime | null =
    mime && mime !== "application/octet-stream"
      ? (mime as EffectiveImageMime)
      : null;
  if (!effectiveMime) {
    if (ext === "jpg" || ext === "jpeg") effectiveMime = "image/jpeg";
    else if (ext === "png") effectiveMime = "image/png";
    else if (ext === "webp") effectiveMime = "image/webp";
    else if (ext === "gif") effectiveMime = "image/gif";
  }

  if (!effectiveMime) {
    return { ok: false, error: "Could not determine image type." };
  }

  const sniffBytes = Math.min(16, file.size);
  const buf = await readFileHead(file, sniffBytes);

  const detected = detectMagicFormat(buf);
  const magicOk = magicValidForClaimed(buf, effectiveMime);

  if (isDev()) {
    devLogAdminImage("validate", {
      name: (file.name.split(/[/\\]/).pop() ?? "").slice(0, 120),
      mime: file.type || "",
      mimeNormalized: mime,
      ext,
      effectiveMime,
      sniffLength: buf.length,
      detectedMagic: detected,
      magicMatchesClaimed: magicOk,
    });
  }

  if (!magicOk) {
    return { ok: false, error: INVALID_MAGIC };
  }

  return { ok: true };
}
