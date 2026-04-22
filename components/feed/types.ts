export type PostCategory = "Movie" | "Show" | "Anime" | "Game" | "Tech";

export type PostCardVariant =
  | "featured"
  | "secondary"
  | "supporting"
  | "standard";

export type PostCardData = {
  href: string;
  title: string;
  category: PostCategory;
  image: {
    src: string;
    alt: string;
  };
  /** Optional copy for list-style layouts (e.g. LATEST band). */
  excerpt?: string;
  author?: string;
  timeLabel?: string;
};

/** Editorial homepage slots — swap for CMS later. */
export type EditorialFeedLayout = {
  featured: PostCardData;
  secondary: PostCardData[];
  latest: PostCardData[];
};
