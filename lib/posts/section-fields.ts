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

export function sectionImageFormName(n: PostSectionIndex): string {
  return `section_${n}_image`;
}

export function sectionTextFormName(n: PostSectionIndex): string {
  return `section_${n}_text`;
}

/** True if any `section_*` column has non-empty content (text or image path). */
export function postHasEditorialSections(post: {
  [key: string]: unknown;
}): boolean {
  for (const n of INDICES) {
    const t = post[`section_${n}_text`];
    const i = post[`section_${n}_image`];
    if (typeof t === "string" && t.trim()) return true;
    if (typeof i === "string" && i.trim()) return true;
  }
  return false;
}
