import { postSectionIndices } from "@/lib/posts/section-fields";

export type EditorialSectionPart =
  | { kind: "text"; section: number; text: string }
  | { kind: "image_top"; section: number; storagePath: string }
  | { kind: "video_top"; section: number; url: string }
  | { kind: "image"; section: number; storagePath: string }
  | { kind: "video"; section: number; url: string };

/**
 * Flattened parts matching `ArticleEditorialContent`:
 * within each section index: top image/video, text, then bottom image/video.
 * Empty section indices are omitted entirely.
 */
export function getEditorialSectionParts(
  post: Record<string, unknown>,
): EditorialSectionPart[] {
  const parts: EditorialSectionPart[] = [];
  for (const n of postSectionIndices()) {
    const t = post[`section_${n}_text`];
    const it = post[`section_${n}_image_top`];
    const vt = post[`section_${n}_video_url_top`];
    const i = post[`section_${n}_image`];
    const v = post[`section_${n}_video_url`];
    const textStr = typeof t === "string" && t.trim() ? t : null;
    const topImgPath = typeof it === "string" && it.trim() ? it.trim() : null;
    const topVideoUrl = typeof vt === "string" && vt.trim() ? vt.trim() : null;
    const imgPath = typeof i === "string" && i.trim() ? i.trim() : null;
    const videoUrl = typeof v === "string" && v.trim() ? v.trim() : null;
    if (!textStr && !topImgPath && !topVideoUrl && !imgPath && !videoUrl) continue;
    if (topImgPath) {
      parts.push({ kind: "image_top", section: n, storagePath: topImgPath });
    }
    if (topVideoUrl) {
      parts.push({ kind: "video_top", section: n, url: topVideoUrl });
    }
    if (textStr) {
      parts.push({ kind: "text", section: n, text: textStr });
    }
    if (imgPath) {
      parts.push({ kind: "image", section: n, storagePath: imgPath });
    }
    if (videoUrl) {
      parts.push({ kind: "video", section: n, url: videoUrl });
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
