import type { PostCategoryDb } from "@/lib/database.types";

/** URL / UI category for the homepage Latest list (maps to `posts.category`). */
export type LatestListCat = "all" | "movies" | "tv" | "anime" | "gaming" | "tech";

export const LATEST_PER_PAGE = 25;

const CAT_SET = new Set<string>(["all", "movies", "tv", "anime", "gaming", "tech"]);

export function parseLatestListCat(
  raw: string | string[] | undefined,
): LatestListCat {
  const v = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase();
  if (v && CAT_SET.has(v)) return v as LatestListCat;
  return "all";
}

export function parseLatestListPage(
  raw: string | string[] | undefined,
): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(String(v ?? "1"), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function dbCategoryFromLatestListCat(
  cat: LatestListCat,
): PostCategoryDb | null {
  if (cat === "all") return null;
  const map: Record<Exclude<LatestListCat, "all">, PostCategoryDb> = {
    movies: "Movie",
    tv: "Show",
    anime: "Anime",
    gaming: "Game",
    tech: "Tech",
  };
  return map[cat];
}

/** Build `?cat=&page=` query for Latest links (omit defaults). */
export function latestListQueryString(cat: LatestListCat, page: number): string {
  const qs = new URLSearchParams();
  if (cat !== "all") qs.set("cat", cat);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}
