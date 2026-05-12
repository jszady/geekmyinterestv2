import { richHtmlToPlainText } from "@/lib/content/sanitize-rich-html";
import { parseYouTubeVideoId } from "@/lib/posts/section-video";
import {
  postSectionIndices,
  sectionImageFormName,
  sectionTextFormName,
  sectionTopImageFormName,
  sectionTopVideoFormName,
  sectionVideoFormName,
} from "@/lib/posts/section-fields";

export type SpacerSize = "sm" | "md" | "lg";

export type ContentBlockType = "text" | "image" | "youtube" | "divider" | "spacer";

export type ContentBlock =
  | { id: string; type: "text"; order: number; data: { html: string } }
  | {
      id: string;
      type: "image";
      order: number;
      data: { storagePath: string | null; caption: string };
    }
  | { id: string; type: "youtube"; order: number; data: { url: string } }
  | { id: string; type: "divider"; order: number; data: Record<string, never> }
  | { id: string; type: "spacer"; order: number; data: { size: SpacerSize } };

export function postHasContentBlocks(post: { content_blocks?: unknown }): boolean {
  const raw = post.content_blocks;
  if (raw == null) return false;
  if (!Array.isArray(raw)) return false;
  return raw.length > 0;
}

export function emptySectionFieldsPayload(): Record<string, string | null> {
  const payload: Record<string, string | null> = {};
  for (const n of postSectionIndices()) {
    payload[sectionTextFormName(n)] = null;
    payload[sectionTopImageFormName(n)] = null;
    payload[sectionTopVideoFormName(n)] = null;
    payload[sectionImageFormName(n)] = null;
    payload[sectionVideoFormName(n)] = null;
  }
  return payload;
}

export function collectStoragePathsFromContentBlocks(
  blocks: unknown,
): string[] {
  if (!blocks || !Array.isArray(blocks)) return [];
  const paths: string[] = [];
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const o = b as Record<string, unknown>;
    if (o.type !== "image") continue;
    const data = o.data as Record<string, unknown> | undefined;
    const p = data?.storagePath;
    if (typeof p === "string" && p.trim()) paths.push(p.trim());
  }
  return paths;
}

function isUuidLike(id: unknown): id is string {
  return typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id);
}

function isSpacerSize(s: unknown): s is SpacerSize {
  return s === "sm" || s === "md" || s === "lg";
}

/** Parse and validate JSON from admin; returns error message or normalized blocks. */
export function parseAndValidateContentBlocksJson(
  raw: string,
): { ok: true; blocks: ContentBlock[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: "Invalid content blocks JSON." };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, error: "Add at least one content block." };
  }

  const blocks: ContentBlock[] = [];
  let order = 0;
  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Each block must be an object." };
    }
    const o = item as Record<string, unknown>;
    const id = o.id;
    const type = o.type;
    const data = o.data;
    if (!isUuidLike(id)) {
      return { ok: false, error: "Each block needs a valid id." };
    }
    if (typeof type !== "string") {
      return { ok: false, error: "Each block needs a type." };
    }
    if (!data || typeof data !== "object") {
      return { ok: false, error: "Each block needs a data object." };
    }
    const d = data as Record<string, unknown>;

    switch (type) {
      case "text": {
        const html = typeof d.html === "string" ? d.html : "";
        const plain = richHtmlToPlainText(html).trim();
        if (!plain) {
          return { ok: false, error: "Text blocks cannot be empty." };
        }
        blocks.push({ id, type: "text", order, data: { html } });
        break;
      }
      case "image": {
        const storagePath =
          typeof d.storagePath === "string" && d.storagePath.trim()
            ? d.storagePath.trim()
            : null;
        const caption = typeof d.caption === "string" ? d.caption.trim() : "";
        if (!storagePath) {
          return {
            ok: false,
            error: "Each image block needs an uploaded image.",
          };
        }
        blocks.push({
          id,
          type: "image",
          order,
          data: { storagePath, caption },
        });
        break;
      }
      case "youtube": {
        const url = typeof d.url === "string" ? d.url.trim() : "";
        if (!url || !parseYouTubeVideoId(url)) {
          return { ok: false, error: "Each YouTube block needs a valid YouTube URL." };
        }
        blocks.push({ id, type: "youtube", order, data: { url } });
        break;
      }
      case "divider": {
        blocks.push({ id, type: "divider", order, data: {} });
        break;
      }
      case "spacer": {
        const size = d.size;
        if (!isSpacerSize(size)) {
          return { ok: false, error: "Spacer blocks need size sm, md, or lg." };
        }
        blocks.push({ id, type: "spacer", order, data: { size } });
        break;
      }
      default:
        return { ok: false, error: `Unknown block type: ${type}` };
    }
    order += 1;
  }

  return { ok: true, blocks };
}

/**
 * Apply file uploads and clear-image flags to draft blocks (before final validation).
 * New upload wins over clear when both are present in the same submit.
 */
export async function mergeV2ImageBlocksFromFormData(
  draft: unknown[],
  formData: FormData,
  uploadField: (fd: FormData, field: string) => Promise<string | null>,
): Promise<unknown[]> {
  return Promise.all(
    draft.map(async (item) => {
      if (!item || typeof item !== "object") return item;
      const o = item as Record<string, unknown>;
      if (o.type !== "image") return item;
      const id = o.id;
      if (typeof id !== "string") return item;
      const data = { ...((o.data as Record<string, unknown>) ?? {}) };
      const uploaded = await uploadField(formData, `v2img_${id}`);
      if (uploaded) {
        data.storagePath = uploaded;
      } else if (data.clearImage === true) {
        data.storagePath = null;
      }
      delete data.clearImage;
      return { ...o, data };
    }),
  );
}
