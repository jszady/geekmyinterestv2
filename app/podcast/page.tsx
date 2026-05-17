import type { Metadata } from "next";
import { PodcastAbout } from "@/components/podcast/PodcastAbout";
import { PodcastComingSoon } from "@/components/podcast/PodcastComingSoon";
import { PodcastEpisodeGrid } from "@/components/podcast/PodcastEpisodeGrid";
import { PodcastFeaturedEpisode } from "@/components/podcast/PodcastFeaturedEpisode";
import { PodcastHero } from "@/components/podcast/PodcastHero";
import { PodcastPlatforms } from "@/components/podcast/PodcastPlatforms";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import type { PodcastEpisodeView } from "@/lib/podcast/data";
import { PODCAST_HERO_IMAGE } from "@/lib/podcast/data";
import { podcastImagePublicUrl } from "@/lib/podcast/image-url";
import type { PodcastEpisodeRow } from "@/lib/database.types";
import {
  fetchLatestPublishedPodcastEpisode,
  fetchPublishedPodcastEpisodesCount,
  fetchPublishedPodcastEpisodesGridPage,
} from "@/lib/podcast/queries";
import { buildPageMetadata, getAbsoluteUrl } from "@/lib/seo";

const PODCAST_GRID_PER_PAGE = 25;

const basePodcastTitle = "Podcast | Geek My Interest";
const basePodcastDescription =
  "The Geek My Interest Podcast — hot takes, deep dives, and debates across movies, anime, gaming, and nerd culture.";

function parsePodcastGridPage(
  raw: string | string[] | undefined,
): number {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(String(v ?? "1"), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function podcastCanonicalPath(page: number): string {
  if (page <= 1) return "/podcast";
  return `/podcast?page=${page}`;
}

type PageProps = {
  searchParams?: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : undefined;
  const page = parsePodcastGridPage(sp?.page);
  const title = page > 1 ? `${basePodcastTitle} · Page ${page}` : basePodcastTitle;
  const ogImage = getAbsoluteUrl("/images/podtrans.png");

  return buildPageMetadata({
    title,
    description: basePodcastDescription,
    canonicalPath: podcastCanonicalPath(page),
    absoluteTitle: true,
    ogType: "website",
    ogImageUrl: ogImage,
    ogImageAlt: "Geek My Interest Podcast",
  });
}

async function episodeRowToView(row: PodcastEpisodeRow): Promise<PodcastEpisodeView> {
  return {
    id: row.id,
    slug: row.slug,
    number: row.episode_number ? String(row.episode_number) : "—",
    title: row.title,
    summary: row.description ?? "New episode now live.",
    runtime: row.runtime ?? "Runtime TBA",
    thumbnailUrl:
      (await podcastImagePublicUrl(row.thumbnail_image)) ?? PODCAST_HERO_IMAGE,
    youtubeUrl: row.youtube_url,
    spotifyUrl: row.spotify_url,
    appleMusicUrl: row.apple_music_url,
  };
}

export default async function PodcastPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const requestedPage = parsePodcastGridPage(sp?.page);

  const totalPublished = await fetchPublishedPodcastEpisodesCount();
  const gridTotal = Math.max(0, totalPublished - 1);
  const totalGridPages =
    gridTotal <= 0 ? 1 : Math.ceil(gridTotal / PODCAST_GRID_PER_PAGE);
  const gridPage = Math.min(Math.max(1, requestedPage), totalGridPages);

  const [featuredRow, gridRows] = await Promise.all([
    fetchLatestPublishedPodcastEpisode(),
    gridTotal > 0
      ? fetchPublishedPodcastEpisodesGridPage(gridPage, PODCAST_GRID_PER_PAGE)
      : Promise.resolve([]),
  ]);

  const featured =
    featuredRow === null ? null : await episodeRowToView(featuredRow);
  const gridEpisodes: PodcastEpisodeView[] = await Promise.all(
    gridRows.map((row) => episodeRowToView(row)),
  );

  const isEmpty = totalPublished === 0;

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <PodcastHero />
      {isEmpty ? (
        <PodcastComingSoon />
      ) : (
        <>
          <PodcastFeaturedEpisode episode={featured} />
          <PodcastEpisodeGrid
            episodes={gridEpisodes}
            gridPage={gridPage}
            gridTotalCount={gridTotal}
            perPage={PODCAST_GRID_PER_PAGE}
          />
          <PodcastPlatforms />
          <PodcastAbout />
        </>
      )}
    </main>
  );
}
