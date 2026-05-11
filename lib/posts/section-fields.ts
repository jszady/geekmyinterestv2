/** Number of editorial sections stored on `posts` (matches DB columns). */
export const POST_SECTION_COUNT = 15;

export type PostSectionIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

const INDICES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const satisfies readonly PostSectionIndex[];

export function postSectionIndices(): readonly PostSectionIndex[] {
  return INDICES;
}

export function sectionTextColumn(n: PostSectionIndex): `section_${PostSectionIndex}_text` {
  return `section_${n}_text`;
}

export function sectionImageColumn(n: PostSectionIndex): `section_${PostSectionIndex}_image` {
  return `section_${n}_image`;
}

export function sectionTopImageColumn(
  n: PostSectionIndex,
): `section_${PostSectionIndex}_image_top` {
  return `section_${n}_image_top`;
}

export function sectionImageFormName(n: PostSectionIndex): string {
  return `section_${n}_image`;
}

export function sectionTopImageFormName(n: PostSectionIndex): string {
  return `section_${n}_image_top`;
}

export function sectionTextFormName(n: PostSectionIndex): string {
  return `section_${n}_text`;
}

export function sectionVideoFormName(n: PostSectionIndex): string {
  return `section_${n}_video_url`;
}

export function sectionTopVideoFormName(n: PostSectionIndex): string {
  return `section_${n}_video_url_top`;
}

/** True if any `section_*` column has non-empty content (text, image path, or video URL). */
export function postHasEditorialSections(post: {
  [key: string]: unknown;
}): boolean {
  for (const n of INDICES) {
    const t = post[`section_${n}_text`];
    const it = post[`section_${n}_image_top`];
    const vt = post[`section_${n}_video_url_top`];
    const i = post[`section_${n}_image`];
    const v = post[`section_${n}_video_url`];
    if (typeof t === "string" && t.trim()) return true;
    if (typeof it === "string" && it.trim()) return true;
    if (typeof vt === "string" && vt.trim()) return true;
    if (typeof i === "string" && i.trim()) return true;
    if (typeof v === "string" && v.trim()) return true;
  }
  return false;
}
