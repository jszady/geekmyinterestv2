import type { EditorialFeedLayout, PostCardData } from "./types";

/** Flat list for tests or simple maps — same stories as `editorialFeed`. */
export const featuredArticles: PostCardData[] = [
  {
    href: "/articles/hulu-buffy-reboot-update",
    title: "Hulu Cancels Buffy Reboot — What It Means for Legacy Fans",
    category: "Show",
    image: {
      src: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=900&q=80",
      alt: "Dramatic TV still placeholder",
    },
  },
  {
    href: "/articles/space-opera-trailer-breakdown",
    title: "Every Easter Egg in the New Space Opera Trailer",
    category: "Movie",
    image: {
      src: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80",
      alt: "Cinema audience placeholder",
    },
  },
  {
    href: "/articles/anime-season-preview",
    title: "The 5 Anime Series Everyone Will Be Talking About This Season",
    category: "Anime",
    image: {
      src: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=900&q=80",
      alt: "Neon city placeholder",
    },
  },
  {
    href: "/articles/open-world-rpg-launch",
    title: "Open-World RPG Launch Day: Performance, Story, and First Verdict",
    category: "Game",
    image: {
      src: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900&q=80",
      alt: "Gaming setup placeholder",
    },
  },
  {
    href: "/articles/streaming-wars-roundup",
    title: "Streaming Wars: Who Won the Quarter in Geek TV?",
    category: "Show",
    image: {
      src: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=900&q=80",
      alt: "Home theater placeholder",
    },
  },
  {
    href: "/articles/indie-film-festival-highlights",
    title: "Indie Film Festival Highlights You Should Not Miss",
    category: "Movie",
    image: {
      src: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&q=80",
      alt: "Film production placeholder",
    },
  },
  {
    href: "/articles/comic-adaptation-rumors",
    title: "The Comic Adaptation Rumors That Refuse to Die — Fact vs Fiction",
    category: "Movie",
    image: {
      src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=900&q=80",
      alt: "Comics and media placeholder",
    },
  },
  {
    href: "/articles/esports-finals-recap",
    title: "Esports Finals Recap: The Plays That Defined the Championship",
    category: "Game",
    image: {
      src: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=900&q=80",
      alt: "Esports arena placeholder",
    },
  },
  {
    href: "/articles/sci-fi-franchise-timeline",
    title: "The Sci-Fi Franchise Timeline Fans Are Using to Predict the Next Drop",
    category: "Movie",
    image: {
      src: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900&q=80",
      alt: "Space and science fiction placeholder",
    },
  },
  {
    href: "/articles/podcast-weekly-wrap",
    title: "Podcast Wrap: The Week's Biggest Geek Culture Debates, Settled",
    category: "Show",
    image: {
      src: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=900&q=80",
      alt: "Podcast studio placeholder",
    },
  },
  {
    href: "/articles/retro-console-price-surge",
    title: "Retro Console Prices Spike — What Collectors Should Know Before Buying",
    category: "Game",
    image: {
      src: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=900&q=80",
      alt: "Retro gaming placeholder",
    },
  },
  {
    href: "/articles/limited-edition-drop-sells-out",
    title: "Limited Edition Drop Sells Out in Minutes — What Restock Rumors Say",
    category: "Game",
    image: {
      src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=900&q=80",
      alt: "Gaming merchandise placeholder",
    },
  },
  {
    href: "/articles/creator-interview-season-finale",
    title: "Showrunner Interview: How the Season Finale Sets Up What's Next",
    category: "Show",
    image: {
      src: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80",
      alt: "Interview and studio placeholder",
    },
  },
];

/**
 * Lead band: featured + 8 supporting slots (4 stacked rtop + 3 bottom row + rbottom).
 */
export const editorialFeed: EditorialFeedLayout = {
  featured: featuredArticles[0]!,
  secondary: [
    featuredArticles[1]!,
    featuredArticles[2]!,
    featuredArticles[11]!,
    featuredArticles[12]!,
    featuredArticles[3]!,
    featuredArticles[4]!,
    featuredArticles[5]!,
    featuredArticles[6]!,
  ],
  standard: featuredArticles.slice(7, 11),
};
