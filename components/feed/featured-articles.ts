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
 * Lead band: featured + 6 supporting slots (3 rail + 3 bottom row).
 */
export const editorialFeed: EditorialFeedLayout = {
  featured: featuredArticles[0]!,
  secondary: [
    featuredArticles[1]!,
    featuredArticles[2]!,
    featuredArticles[11]!,
    featuredArticles[3]!,
    featuredArticles[4]!,
    featuredArticles[5]!,
  ],
  latest: [
    {
      ...featuredArticles[1]!,
      timeLabel: "9 minutes ago",
      excerpt:
        "A scene-by-scene look at the trailer moments fans are already connecting to older franchise lore.",
      author: "Faith Roswell",
    },
    {
      ...featuredArticles[2]!,
      timeLabel: "11 minutes ago",
      excerpt:
        "What the first reactions say about pacing, soundtrack, and why this season may outgrow expectations.",
      author: "Cher Thompson",
    },
    {
      ...featuredArticles[3]!,
      timeLabel: "14 minutes ago",
      excerpt:
        "Early launch metrics, patch stability, and the one system dominating player discussion right now.",
      author: "Angharad Redden",
    },
    {
      ...featuredArticles[5]!,
      timeLabel: "24 minutes ago",
      excerpt:
        "Separating credible signals from noise — and what studios have actually confirmed versus fan wishlists.",
      author: "Riley Park",
    },
    {
      ...featuredArticles[7]!,
      timeLabel: "42 minutes ago",
      excerpt:
        "Highlights from the arena, key team adjustments, and the moments that swung momentum in the final maps.",
      author: "Jordan Lee",
    },
    {
      ...featuredArticles[8]!,
      timeLabel: "2 hours ago",
      excerpt:
        "How canon dates line up with recent announcements — and what fans are getting wrong about the next chapter.",
      author: "Sam Rivera",
    },
    {
      ...featuredArticles[9]!,
      timeLabel: "Yesterday",
      excerpt:
        "The debates that dominated forums this week, distilled into clear takeaways (and a few spicy opinions).",
      author: "Morgan Ellis",
    },
    {
      ...featuredArticles[10]!,
      timeLabel: "5 hours ago",
      excerpt:
        "Price trends, authenticity checks, and what to watch for before you pull the trigger on a “mint” listing.",
      author: "Casey Ng",
    },
    {
      ...featuredArticles[12]!,
      timeLabel: "8 hours ago",
      excerpt:
        "Spoiler-free context on the finale’s biggest swings — and how they set up the story the writers want to tell next.",
      author: "Alex Kim",
    },
  ],
};
