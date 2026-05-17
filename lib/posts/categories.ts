/** DB value stored in `posts.category`. */
export const POST_CATEGORY_DB_VALUES = [
  "Movie",
  "Anime",
  "Show",
  "Game",
  "Tech",
  "Comics",
] as const;

export type PostCategoryDb = (typeof POST_CATEGORY_DB_VALUES)[number];

export type PostCategorySlug =
  | "movies"
  | "anime"
  | "shows"
  | "games"
  | "tech"
  | "comics";

export const CATEGORY_BY_SLUG: Record<
  PostCategorySlug,
  { db: PostCategoryDb; label: string }
> = {
  movies: { db: "Movie", label: "Movies" },
  anime: { db: "Anime", label: "Anime" },
  shows: { db: "Show", label: "Shows" },
  games: { db: "Game", label: "Games" },
  tech: { db: "Tech", label: "Tech" },
  comics: { db: "Comics", label: "Comics" },
};

export const CATEGORY_SLUGS = Object.keys(CATEGORY_BY_SLUG) as PostCategorySlug[];

/** Per-category SEO for `/category/[slug]`. */
export const CATEGORY_SEO: Record<
  PostCategorySlug,
  { title: string; description: string }
> = {
  anime: {
    title: "Anime | Geek My Interest",
    description:
      "Anime news, rankings, reviews, and hot takes from Geek My Interest, covering upcoming releases, fan favourites, and everything worth watching.",
  },
  movies: {
    title: "Movies | Geek My Interest",
    description:
      "Movie news, rankings, reviews, trailers, and hot takes from Geek My Interest, covering blockbusters, adaptations, franchises, and fan favourites.",
  },
  games: {
    title: "Gaming | Geek My Interest",
    description:
      "Gaming news, rankings, reviews, and hot takes from Geek My Interest, covering new releases, trailers, RPGs, action games, and fan favourites.",
  },
  shows: {
    title: "Shows | Geek My Interest",
    description:
      "TV and streaming news, rankings, reviews, and hot takes from Geek My Interest, covering new shows, returning series, and fan favourites.",
  },
  tech: {
    title: "Tech | Geek My Interest",
    description:
      "Tech news, AI updates, gadgets, digital culture, and geek-friendly tech stories from Geek My Interest.",
  },
  comics: {
    title: "Comics | Geek My Interest",
    description:
      "Comic news, Marvel/DC discussions, graphic novels, superhero lore, comic adaptations, and fandom coverage from Geek My Interest.",
  },
};

/** Homepage Latest list filter ids (URL `?cat=`). Uses legacy ids `tv` / `gaming` for Shows / Games. */
export type LatestListCat =
  | "all"
  | "movies"
  | "tv"
  | "anime"
  | "gaming"
  | "tech"
  | "comics";

export const LATEST_LIST_FILTERS: { id: LatestListCat; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "movies", label: "MOVIES" },
  { id: "tv", label: "TV" },
  { id: "anime", label: "ANIME" },
  { id: "gaming", label: "GAMING" },
  { id: "tech", label: "TECH" },
  { id: "comics", label: "COMICS" },
];

const LATEST_CAT_SET = new Set<string>(LATEST_LIST_FILTERS.map((f) => f.id));

/** Maps homepage `?cat=` to DB category (tv → Show, gaming → Game). */
const LATEST_TO_DB: Record<Exclude<LatestListCat, "all">, PostCategoryDb> = {
  movies: "Movie",
  tv: "Show",
  anime: "Anime",
  gaming: "Game",
  tech: "Tech",
  comics: "Comics",
};

export function parseLatestListCat(
  raw: string | string[] | undefined,
): LatestListCat {
  const v = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase();
  if (v && LATEST_CAT_SET.has(v)) return v as LatestListCat;
  return "all";
}

export function dbCategoryFromLatestListCat(
  cat: LatestListCat,
): PostCategoryDb | null {
  if (cat === "all") return null;
  return LATEST_TO_DB[cat];
}

export function slugFromDbCategory(db: string): PostCategorySlug | null {
  for (const slug of CATEGORY_SLUGS) {
    if (CATEGORY_BY_SLUG[slug].db === db) return slug;
  }
  return null;
}

export function categoryChannelLabel(db: PostCategoryDb): string {
  switch (db) {
    case "Movie":
      return "MOVIES";
    case "Show":
      return "TV";
    case "Anime":
      return "ANIME";
    case "Game":
      return "GAMING";
    case "Tech":
      return "TECH";
    case "Comics":
      return "COMICS";
    default:
      return db;
  }
}

export function isPostCategoryDb(value: string): value is PostCategoryDb {
  return (POST_CATEGORY_DB_VALUES as readonly string[]).includes(value);
}
