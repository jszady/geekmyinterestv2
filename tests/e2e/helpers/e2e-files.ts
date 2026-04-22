/** Minimal valid 1×1 PNG (transparent) for upload fields. */
export const TINY_PNG_BUFFER: Buffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export function tinyPngFile(name: string) {
  return {
    name,
    mimeType: "image/png",
    buffer: TINY_PNG_BUFFER,
  };
}
