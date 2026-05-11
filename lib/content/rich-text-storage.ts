import { looksLikeHtml } from "@/lib/content/sanitize-rich-html";

export function normalizeRichTextForStorage(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  // Tiptap HTML can be "empty" visually (e.g. <p><br></p>) but must still persist — do not drop it.
  if (looksLikeHtml(raw)) return raw;
  return raw;
}
