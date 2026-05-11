import Image from "next/image";
import Link from "next/link";
import { looksLikeHtml, sanitizeRichHtml } from "@/lib/content/sanitize-rich-html";
import type { PodcastEpisodeView } from "@/lib/podcast/data";

const featuredPlatformLinks = [
  {
    id: "youtube",
    label: "Watch on YouTube",
    key: "youtubeUrl" as const,
    hoverClass: "hover:text-[#FF0000]",
  },
  {
    id: "spotify",
    label: "Listen on Spotify",
    key: "spotifyUrl" as const,
    hoverClass: "hover:text-[#1DB954]",
  },
  {
    id: "apple",
    label: "Apple Music",
    key: "appleMusicUrl" as const,
    hoverClass: "hover:text-[#FA243C]",
  },
] as const;

export function PodcastFeaturedEpisode({
  episode,
}: {
  episode: PodcastEpisodeView | null;
}) {
  if (!episode) return null;
  const hasRichSummary = looksLikeHtml(episode.summary);

  return (
    <section
      id="featured-episode"
      className="relative z-10 border-b border-white/[0.06] py-14 sm:py-16 md:py-20"
      aria-labelledby="featured-episode-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_50%,rgba(168,85,247,0.06),transparent_60%)]" />

      <div className="relative mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-fuchsia-300/75">
            Latest episode
          </p>
          <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-fuchsia-300/90">
            New
          </span>
        </div>
        <h2
          id="featured-episode-heading"
          className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl"
        >
          Featured
        </h2>

        <article className="mt-8 grid gap-8 rounded-2xl border border-white/[0.07] bg-[#040812]/75 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm sm:p-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-center lg:gap-10 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-xl bg-zinc-950 lg:max-w-none">
            <div className="absolute inset-0 bg-gradient-to-t from-[#040812]/90 via-transparent to-transparent" />
            <Image
              src={episode.thumbnailUrl}
              alt="Featured episode artwork"
              fill
              className="object-cover object-[45%_35%]"
              sizes="(max-width: 1024px) 100vw, 380px"
            />
          </div>

          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-cyan-200/90">
                Episode {episode.number}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-zinc-300">
                Podcast
              </span>
              <span className="ml-1 text-zinc-500">{episode.runtime}</span>
            </div>
            <h3 className="text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl">
              {episode.title}
            </h3>
            {hasRichSummary ? (
              <div
                className="article-rich-body max-w-2xl text-zinc-300 sm:text-lg"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(episode.summary) }}
              />
            ) : (
              <p className="max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                {episode.summary}
              </p>
            )}
            <div className="border-t border-white/[0.06] pt-4">
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Listen on
              </p>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-sm font-medium">
                {featuredPlatformLinks
                  .filter((platform) => !!episode[platform.key]?.trim())
                  .map((platform, index, arr) => (
                    <span key={platform.id} className="inline-flex items-center">
                      <Link
                        href={episode[platform.key] ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-zinc-300 transition-colors duration-200 ${platform.hoverClass}`}
                      >
                        {platform.label}
                      </Link>
                      {index < arr.length - 1 && (
                        <span className="pl-1.5 text-zinc-700" aria-hidden>
                          ·
                        </span>
                      )}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
