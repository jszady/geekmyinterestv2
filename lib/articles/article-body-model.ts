import { postSectionIndices } from "@/lib/posts/section-fields";

export type EditorialSectionPart =
  | { kind: "text"; section: number; text: string }
  | { kind: "image"; section: number; storagePath: string };

/**
 * Flattened parts matching `ArticleEditorialContent`: within each section index, text (if any) then image (if any).
 * Empty section indices are omitted entirely.
 */
export function getEditorialSectionParts(
  post: Record<string, unknown>,
): EditorialSectionPart[] {
  const parts: EditorialSectionPart[] = [];
  for (const n of postSectionIndices()) {
    const t = post[`section_${n}_text`];
    const i = post[`section_${n}_image`];
    const textStr = typeof t === "string" && t.trim() ? t : null;
    const imgPath = typeof i === "string" && i.trim() ? i.trim() : null;
    if (!textStr && !imgPath) continue;
    if (textStr) {
      parts.push({ kind: "text", section: n, text: textStr });
    }
    if (imgPath) {
      parts.push({ kind: "image", section: n, storagePath: imgPath });
    }
  }
  return parts;
}

export type LegacyArticlePart =
  | { kind: "body1"; text: string }
  | { kind: "inline_image" }
  | { kind: "body2"; text: string };

/**
 * Fixed order for legacy columns: body_part_1 → inline_image → body_part_2 (each omitted if empty).
 */
export function getLegacyArticleParts(post: Record<string, unknown>): LegacyArticlePart[] {
  const parts: LegacyArticlePart[] = [];
  const b1 = post.body_part_1;
  if (typeof b1 === "string" && b1.trim()) {
    parts.push({ kind: "body1", text: b1.trim() });
  }
  const inline = post.inline_image;
  if (typeof inline === "string" && inline.trim()) {
    parts.push({ kind: "inline_image" });
  }
  const b2 = post.body_part_2;
  if (typeof b2 === "string" && b2.trim()) {
    parts.push({ kind: "body2", text: b2.trim() });
  }
  return parts;
}
