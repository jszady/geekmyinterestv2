import {
  ADMIN_IMAGE_UPLOAD_MAX_BYTES,
  validateAdminImageUpload,
} from "@/lib/storage/validate-admin-image-upload";

function file(name: string, type: string, size = 100): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("validateAdminImageUpload", () => {
  it("accepts PNG with image/png", () => {
    expect(validateAdminImageUpload(file("shot.png", "image/png"))).toEqual({ ok: true });
  });

  it("accepts JPEG with image/jpeg", () => {
    expect(validateAdminImageUpload(file("a.jpeg", "image/jpeg"))).toEqual({ ok: true });
    expect(validateAdminImageUpload(file("a.jpg", "image/jpeg"))).toEqual({ ok: true });
  });

  it("accepts WebP and GIF", () => {
    expect(validateAdminImageUpload(file("w.webp", "image/webp"))).toEqual({ ok: true });
    expect(validateAdminImageUpload(file("g.gif", "image/gif"))).toEqual({ ok: true });
  });

  it("accepts application/octet-stream when extension is allowed", () => {
    expect(validateAdminImageUpload(file("x.png", "application/octet-stream"))).toEqual({
      ok: true,
    });
  });

  it("accepts empty MIME with allowed extension", () => {
    expect(validateAdminImageUpload(file("x.png", ""))).toEqual({ ok: true });
  });

  it("rejects oversize files (> 5MB)", () => {
    const big = file("huge.png", "image/png", ADMIN_IMAGE_UPLOAD_MAX_BYTES + 1);
    const r = validateAdminImageUpload(big);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/5MB/);
  });

  it("rejects https://evil.com style names via extension rules", () => {
    const r = validateAdminImageUpload(file("evil.com", "image/png"));
    expect(r.ok).toBe(false);
  });

  it("rejects SVG and HTML extensions", () => {
    expect(validateAdminImageUpload(file("x.svg", "image/svg+xml")).ok).toBe(false);
    expect(validateAdminImageUpload(file("x.html", "text/html")).ok).toBe(false);
    expect(validateAdminImageUpload(file("x.js", "image/jpeg")).ok).toBe(false);
    expect(validateAdminImageUpload(file("x.php", "image/png")).ok).toBe(false);
    expect(validateAdminImageUpload(file("x.exe", "application/octet-stream")).ok).toBe(
      false,
    );
  });

  it("rejects unknown extension", () => {
    expect(validateAdminImageUpload(file("x.bmp", "image/bmp")).ok).toBe(false);
  });

  it("rejects disallowed MIME", () => {
    expect(validateAdminImageUpload(file("x.png", "image/svg+xml")).ok).toBe(false);
    expect(validateAdminImageUpload(file("x.gif", "text/html")).ok).toBe(false);
  });

  it("rejects MIME/extension mismatch", () => {
    expect(validateAdminImageUpload(file("x.png", "image/jpeg")).ok).toBe(false);
    expect(validateAdminImageUpload(file("x.jpg", "image/png")).ok).toBe(false);
  });
});
