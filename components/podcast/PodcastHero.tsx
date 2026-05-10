import Image from "next/image";
import Link from "next/link";
import { PODCAST_HERO_IMAGE } from "@/lib/podcast/data";

const primaryCta =
  "inline-flex items-center justify-center rounded-full border border-cyan-400/50 bg-gradient-to-r from-cyan-500/20 to-violet-500/15 px-7 py-3 text-sm font-semibold text-white shadow-[0_0_28px_-6px_rgba(34,211,238,0.45)] transition hover:border-cyan-300/65 hover:shadow-[0_0_36px_-4px_rgba(34,211,238,0.55)]";
const secondaryCta =
  "inline-flex items-center justify-center rounded-full border border-white/14 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-zinc-100 transition hover:border-fuchsia-400/35 hover:bg-white/[0.07]";

export function PodcastHero() {
  return (
    <section
      className="relative z-10 border-b border-white/[0.06] pb-14 pt-28 sm:pt-32 md:pb-20 lg:pt-36"
      aria-labelledby="podcast-hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_20%_20%,rgba(34,211,238,0.13),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_30%,rgba(168,85,247,0.11),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_35%_30%_at_75%_65%,rgba(34,211,238,0.06),transparent_50%)]" />

      <div className="relative mx-auto grid w-full max-w-[1800px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-14 xl:gap-20 lg:px-12 xl:px-16">
        <div className="max-w-xl space-y-6 lg:max-w-none">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400/80">
              Geek My Interest — Audio
            </p>
          </div>
          <h1
            id="podcast-hero-heading"
            className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
          >
            The Geek My Interest Podcast
          </h1>
          <p className="text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Hot takes, deep dives, debates, and everything nerd culture — movies,
            shows, anime, games, and the geek news cycle, served with reactions,
            rankings, and the occasional unhinged prediction you did not ask for
            but absolutely needed.
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-zinc-500">
            <span>8 Episodes</span>
            <span className="text-zinc-700" aria-hidden>·</span>
            <span>New weekly</span>
            <span className="text-zinc-700" aria-hidden>·</span>
            <span>YouTube · Spotify · Apple Music</span>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="#episodes" className={primaryCta}>
              Browse Episodes
            </Link>
            <Link href="#listen" className={secondaryCta}>
              Where to Listen
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            className="pointer-events-none absolute -inset-6 rounded-3xl bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.24),rgba(34,211,238,0.16)_45%,transparent_70%)] blur-2xl sm:-inset-8"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -inset-2 rounded-2xl bg-[radial-gradient(ellipse_80%_80%_at_50%_55%,rgba(34,211,238,0.1),transparent_65%)] blur-xl"
            aria-hidden
          />
          <div className="relative rounded-2xl bg-gradient-to-b from-fuchsia-500/50 via-cyan-400/40 to-fuchsia-500/45 p-px shadow-[0_0_60px_-8px_rgba(217,70,239,0.55),0_0_60px_-12px_rgba(34,211,238,0.45)]">
            <div className="overflow-hidden rounded-[15px] bg-[#040812] ring-1 ring-white/[0.06]">
              <Image
                src={PODCAST_HERO_IMAGE}
                alt="Geek My Interest podcast artwork"
                width={1200}
                height={1200}
                className="h-auto w-full object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
