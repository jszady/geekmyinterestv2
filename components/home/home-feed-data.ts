import type { PostCardData, PostCategory } from "@/components/feed/types";

/** Extra placeholders for category rails (not in the main editorial lead). */
const categoryPool: PostCardData[] = [
  {
    href: "/articles/movie-franchise-next-chapter",
    title: "Major Franchise Sets Its Next Chapter — Release Window Revealed",
    category: "Movie",
    image: {
      src: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
      alt: "Theater lights placeholder",
    },
  },
  {
    href: "/articles/directors-cut-worth-it",
    title: "Which Director’s Cuts Actually Change the Story?",
    category: "Movie",
    image: {
      src: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80",
      alt: "Film reel placeholder",
    },
  },
  {
    href: "/articles/box-office-surprise",
    title: "Box Office Surprise: The Sleeper Hit Outperforming Blockbusters",
    category: "Movie",
    image: {
      src: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80",
      alt: "Cinema seats placeholder",
    },
  },
  {
    href: "/articles/show-renewed-season-3",
    title: "Fan-Favorite Genre Show Officially Renewed for Season 3",
    category: "Show",
    image: {
      src: "https://images.unsplash.com/photo-1509281373149-e473d5273e49?w=800&q=80",
      alt: "TV production placeholder",
    },
  },
  {
    href: "/articles/finale-explained",
    title: "That Finale, Explained: What the Last Scene Really Means",
    category: "Show",
    image: {
      src: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&q=80",
      alt: "Streaming remote placeholder",
    },
  },
  {
    href: "/articles/cast-returns-spinoff",
    title: "Original Cast in Talks for Streaming Spinoff Series",
    category: "Show",
    image: {
      src: "https://images.unsplash.com/photo-1492691527719-9d1e07a534b4?w=800&q=80",
      alt: "Studio microphone placeholder",
    },
  },
  {
    href: "/articles/anime-film-record",
    title: "Anime Film Breaks Opening Records in Multiple Territories",
    category: "Anime",
    image: {
      src: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80",
      alt: "Neon city anime vibe placeholder",
    },
  },
  {
    href: "/articles/manga-adaptation-greenlit",
    title: "Beloved Manga Saga Greenlit as Limited Streaming Adaptation",
    category: "Anime",
    image: {
      src: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=80",
      alt: "Illustration workspace placeholder",
    },
  },
  {
    href: "/articles/studio-merch-collab",
    title: "Iconic Studio Announces Limited Collab Drop for Collectors",
    category: "Anime",
    image: {
      src: "https://images.unsplash.com/photo-1560972550-aba3456b5564?w=800&q=80",
      alt: "Collectibles placeholder",
    },
  },
  {
    href: "/articles/aaa-delay-roadmap",
    title: "AAA Sequel Slips a Quarter — Roadmap and Beta Plans Updated",
    category: "Game",
    image: {
      src: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80",
      alt: "Controller placeholder",
    },
  },
  {
    href: "/articles/indie-hit-sales",
    title: "Indie Roguelite Crosses Major Sales Milestone on Console",
    category: "Game",
    image: {
      src: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
      alt: "Arcade neon placeholder",
    },
  },
  {
    href: "/articles/remaster-trilogy-bundle",
    title: "Classic Trilogy Remaster Bundle Gets Release Date and PC Specs",
    category: "Game",
    image: {
      src: "https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=800&q=80",
      alt: "Retro gaming placeholder",
    },
  },
];

function byCategory(cat: PostCategory, take: number): PostCardData[] {
  return categoryPool.filter((p) => p.category === cat).slice(0, take);
}

export const homeCategoryBands: {
  id: string;
  label: PostCategory;
  title: string;
  description: string;
  posts: PostCardData[];
}[] = [
  {
    id: "movies",
    label: "Movie",
    title: "Movies",
    description: "Trailers, reviews, and industry moves worth watching.",
    posts: byCategory("Movie", 3),
  },
  {
    id: "shows",
    label: "Show",
    title: "Shows",
    description: "Streaming, finales, and the series everyone's discussing.",
    posts: byCategory("Show", 3),
  },
  {
    id: "anime",
    label: "Anime",
    title: "Anime",
    description: "Seasonal picks, films, and culture from Japan and beyond.",
    posts: byCategory("Anime", 3),
  },
  {
    id: "games",
    label: "Game",
    title: "Games",
    description: "Launches, patches, and the titles dominating the conversation.",
    posts: byCategory("Game", 3),
  },
];
