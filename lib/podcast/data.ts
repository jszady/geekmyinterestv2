import { OFFICIAL_LINKS } from "@/lib/social/official-links";

export const PODCAST_HERO_IMAGE = "/images/podtrans.png";

export type PodcastEpisodeView = {
  id: string;
  slug: string;
  number: string;
  title: string;
  summary: string;
  runtime: string;
  thumbnailUrl: string;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
  appleMusicUrl: string | null;
};

export const listenPlatforms = [
  {
    id: "youtube",
    label: "YouTube",
    description: "Full episodes + clips",
    href: OFFICIAL_LINKS.youtube,
  },
  {
    id: "spotify",
    label: "Spotify",
    description: "Stream audio",
    href: OFFICIAL_LINKS.spotify,
  },
  {
    id: "apple",
    label: "Apple Podcasts",
    description: "Episode links only (coming soon)",
    href: null,
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Short reactions",
    href: OFFICIAL_LINKS.tiktok,
  },
] as const;
