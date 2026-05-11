import { looksLikeHtml, richHtmlToPlainText } from "@/lib/content/sanitize-rich-html";

export function normalizeRichTextForStorage(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (!looksLikeHtml(raw)) return raw;
  const plain = richHtmlToPlainText(raw);
  if (!plain) return null;
  return raw;
}
