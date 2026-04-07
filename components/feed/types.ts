export type PostCategory = "Movie" | "Show" | "Anime" | "Game";

export type PostCardVariant = "featured" | "secondary" | "standard";

export type PostCardData = {
  href: string;
  title: string;
  category: PostCategory;
  image: {
    src: string;
    alt: string;
  };
};

/** Editorial homepage slots — swap for CMS later. */
export type EditorialFeedLayout = {
  featured: PostCardData;
  secondary: PostCardData[];
  standard: PostCardData[];
};
