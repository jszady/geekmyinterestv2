import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { PodcastAbout } from "@/components/podcast/PodcastAbout";
import { PodcastFeaturedEpisode } from "@/components/podcast/PodcastFeaturedEpisode";
import { PodcastHero } from "@/components/podcast/PodcastHero";
import { PodcastPlatforms } from "@/components/podcast/PodcastPlatforms";
import type { PodcastEpisodeView } from "@/lib/podcast/data";
import { PODCAST_HERO_IMAGE } from "@/lib/podcast/data";
import { podcastImagePublicUrl } from "@/lib/podcast/image-url";
import { fetchPodcastEpisodeByIdForAdmin } from "@/lib/podcast/queries";
import { getSessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Params = { id: string };

export default async function AdminPodcastPreviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const session = await getSessionUser();
  if (!session?.user) redirect("/login?next=/admin");
  if (!isAdmin(session.profile ?? null)) notFound();

  const { id } = await params;
  const episode = await fetchPodcastEpisodeByIdForAdmin(id);
  if (!episode) notFound();

  const previewEpisode: PodcastEpisodeView = {
    id: episode.id,
    slug: episode.slug,
    number: episode.episode_number ? String(episode.episode_number) : "—",
    title: episode.title,
    summary: episode.description ?? "New episode now live.",
    runtime: episode.runtime ?? "Runtime TBA",
    thumbnailUrl:
      (await podcastImagePublicUrl(episode.thumbnail_image)) ?? PODCAST_HERO_IMAGE,
    youtubeUrl: episode.youtube_url,
    spotifyUrl: episode.spotify_url,
    appleMusicUrl: episode.apple_music_url,
  };

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <div className="relative z-10 mx-auto w-full max-w-[1800px] px-5 pt-24 sm:px-8 lg:px-12 xl:px-16">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="rounded-md border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200">
            Admin preview
          </p>
          <Link
            href={`/admin/podcasts/${episode.id}/edit`}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Back to editor
          </Link>
        </div>
      </div>
      <PodcastHero />
      <PodcastFeaturedEpisode episode={previewEpisode} />
      <PodcastPlatforms />
      <PodcastAbout />
    </main>
  );
}
