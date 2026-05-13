import {
  ADMIN_IMAGE_UPLOAD_MAX_BYTES,
  validateAdminImageUpload,
} from "@/lib/storage/validate-admin-image-upload";

function file(name: string, type: string, body: Uint8Array): File {
  return new File([body], name, { type });
}

function pad(body: Uint8Array, size = 200): Uint8Array {
  const u = new Uint8Array(Math.max(size, body.length));
  u.set(body);
  return u;
}

/** Minimal valid magic prefixes (rest padded). */
const JPEG_HEAD = pad(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]));
const PNG_HEAD = pad(
  new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
);
const GIF_HEAD = pad(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]));
/** RIFF + 4-byte size + WEBP */
const WEBP_HEAD = pad(
  new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  ]),
);

describe("validateAdminImageUpload", () => {
  it("accepts PNG with image/png when magic matches full PNG signature", async () => {
    await expect(
      validateAdminImageUpload(file("shot.png", "image/png", PNG_HEAD)),
    ).resolves.toEqual({ ok: true });
  });

  it("accepts JPEG with image/jpeg", async () => {
    await expect(
      validateAdminImageUpload(file("a.jpeg", "image/jpeg", JPEG_HEAD)),
    ).resolves.toEqual({ ok: true });
    await expect(
      validateAdminImageUpload(file("a.jpg", "image/jpeg", JPEG_HEAD)),
    ).resolves.toEqual({ ok: true });
  });

  it("normalizes image/jpg to JPEG for validation", async () => {
    await expect(
      validateAdminImageUpload(file("a.jpg", "image/jpg", JPEG_HEAD)),
    ).resolves.toEqual({ ok: true });
  });

  it("accepts WebP and GIF", async () => {
    await expect(
      validateAdminImageUpload(file("w.webp", "image/webp", WEBP_HEAD)),
    ).resolves.toEqual({ ok: true });
    await expect(
      validateAdminImageUpload(file("g.gif", "image/gif", GIF_HEAD)),
    ).resolves.toEqual({ ok: true });
  });

  it("accepts application/octet-stream when extension matches magic", async () => {
    await expect(
      validateAdminImageUpload(file("x.png", "application/octet-stream", PNG_HEAD)),
    ).resolves.toEqual({ ok: true });
  });

  it("accepts empty MIME with allowed extension and valid magic", async () => {
    await expect(validateAdminImageUpload(file("x.png", "", PNG_HEAD))).resolves.toEqual({
      ok: true,
    });
  });

  it("rejects oversize files (> 5MB)", async () => {
    const big = file("huge.png", "image/png", new Uint8Array(ADMIN_IMAGE_UPLOAD_MAX_BYTES + 1));
    const r = await validateAdminImageUpload(big);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/5MB/);
  });

  it("rejects https://evil.com style names via extension rules", async () => {
    const r = await validateAdminImageUpload(file("evil.com", "image/png", PNG_HEAD));
    expect(r.ok).toBe(false);
  });

  it("rejects SVG and HTML extensions", async () => {
    expect((await validateAdminImageUpload(file("x.svg", "image/svg+xml", PNG_HEAD))).ok).toBe(
      false,
    );
    expect((await validateAdminImageUpload(file("x.html", "text/html", PNG_HEAD))).ok).toBe(
      false,
    );
    expect((await validateAdminImageUpload(file("x.js", "image/jpeg", JPEG_HEAD))).ok).toBe(
      false,
    );
    expect((await validateAdminImageUpload(file("x.php", "image/png", PNG_HEAD))).ok).toBe(
      false,
    );
    expect(
      (await validateAdminImageUpload(file("x.exe", "application/octet-stream", JPEG_HEAD))).ok,
    ).toBe(false);
  });

  it("rejects unknown extension", async () => {
    expect((await validateAdminImageUpload(file("x.bmp", "image/bmp", PNG_HEAD))).ok).toBe(false);
  });

  it("rejects disallowed MIME", async () => {
    expect((await validateAdminImageUpload(file("x.png", "image/svg+xml", PNG_HEAD))).ok).toBe(
      false,
    );
    expect((await validateAdminImageUpload(file("x.gif", "text/html", GIF_HEAD))).ok).toBe(
      false,
    );
  });

  it("rejects MIME/extension mismatch", async () => {
    expect((await validateAdminImageUpload(file("x.png", "image/jpeg", JPEG_HEAD))).ok).toBe(
      false,
    );
    expect((await validateAdminImageUpload(file("x.jpg", "image/png", PNG_HEAD))).ok).toBe(
      false,
    );
  });

  it("rejects PNG extension when bytes are not a valid PNG", async () => {
    const bad = pad(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00]));
    const r = await validateAdminImageUpload(file("x.png", "image/png", bad));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("not a valid PNG");
  });
});
