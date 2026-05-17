import {
  dbCategoryFromLatestListCat,
  parseLatestListCat,
  type LatestListCat,
} from "@/lib/posts/categories";

export type { LatestListCat };
export { parseLatestListCat, dbCategoryFromLatestListCat };

export const LATEST_PER_PAGE = 25;

export function parseLatestListPage(
  raw: string | string[] | undefined,
): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(String(v ?? "1"), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** Build `?cat=&page=` query for Latest links (omit defaults). */
export function latestListQueryString(cat: LatestListCat, page: number): string {
  const qs = new URLSearchParams();
  if (cat !== "all") qs.set("cat", cat);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}
