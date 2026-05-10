import type { PodcastEpisodeView } from "@/lib/podcast/data";
import Link from "next/link";
import { EpisodeCard } from "./EpisodeCard";

const PODCAST_LIST_PATH = "/podcast";

function podcastPageHref(page: number): string {
  return page <= 1 ? PODCAST_LIST_PATH : `${PODCAST_LIST_PATH}?page=${page}`;
}

export function PodcastEpisodeGrid({
  episodes,
  gridPage,
  gridTotalCount,
  perPage,
}: {
  episodes: PodcastEpisodeView[];
  gridPage: number;
  gridTotalCount: number;
  perPage: number;
}) {
  const totalPages =
    gridTotalCount <= 0 ? 0 : Math.max(1, Math.ceil(gridTotalCount / perPage));
  const showPagination = gridTotalCount > perPage;
  const prevHref = gridPage > 1 ? podcastPageHref(gridPage - 1) : null;
  const nextHref =
    totalPages > 0 && gridPage < totalPages ? podcastPageHref(gridPage + 1) : null;

  return (
    <section
      id="episodes"
      className="relative z-10 border-b border-white/[0.06] py-14 sm:py-16 md:py-20"
      aria-labelledby="episodes-heading"
    >
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-400/75">
              Library
            </p>
            <h2
              id="episodes-heading"
              className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl"
            >
              Recent episodes
            </h2>
          </div>
          <p className="max-w-md text-sm text-zinc-500 sm:text-right">
            Binge the backlog — debates, breakdowns, and the chaos you expect from
            a geek culture desk that actually watches the thing.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {episodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>

        {showPagination ? (
          <nav
            className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-10"
            aria-label="Podcast episodes pagination"
          >
            <div className="text-sm text-zinc-500">
              Page {gridPage} of {totalPages}
              <span className="mx-2 text-zinc-700">·</span>
              {gridTotalCount} episode{gridTotalCount === 1 ? "" : "s"}
            </div>
            <div className="flex gap-3">
              {prevHref ? (
                <Link
                  href={prevHref}
                  scroll={false}
                  className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/35 hover:text-cyan-100"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-600">
                  Previous
                </span>
              )}
              {nextHref ? (
                <Link
                  href={nextHref}
                  scroll={false}
                  className="rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/55"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-600">
                  Next
                </span>
              )}
            </div>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
