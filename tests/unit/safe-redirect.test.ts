import { safeRedirect } from "@/lib/auth/safe-redirect";

const origin = "https://app.example.com";

describe("safeRedirect", () => {
  it("returns / when next is null", () => {
    expect(safeRedirect(null, origin)).toBe("/");
  });

  it("returns / when next is empty", () => {
    expect(safeRedirect("", origin)).toBe("/");
  });

  it("allows ?next=/admin → /admin", () => {
    expect(safeRedirect("/admin", origin)).toBe("/admin");
  });

  it("allows ?next=/podcast → /podcast", () => {
    expect(safeRedirect("/podcast", origin)).toBe("/podcast");
  });

  it("rejects absolute external URLs → /", () => {
    expect(safeRedirect("https://evil.com", origin)).toBe("/");
    expect(safeRedirect("https://evil.com/path", origin)).toBe("/");
  });

  it("rejects protocol-relative external hosts → /", () => {
    expect(safeRedirect("//evil.com/phish", origin)).toBe("/");
  });

  it("allows same-origin path resolved from relative input", () => {
    expect(safeRedirect("/articles/foo?x=1#c", origin)).toBe("/articles/foo?x=1#c");
  });

  it("malformed next values that fail URL parsing fall back to /", () => {
    expect(safeRedirect("https://[", origin)).toBe("/");
  });
});
