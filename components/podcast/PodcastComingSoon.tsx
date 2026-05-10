import Link from "next/link";

const primaryBtn =
  "inline-flex min-h-[48px] min-w-[140px] items-center justify-center rounded-xl border border-cyan-400/50 bg-gradient-to-r from-cyan-500/25 to-violet-500/20 px-6 text-sm font-bold uppercase tracking-wide text-white shadow-[0_0_32px_-8px_rgba(34,211,238,0.45)] transition hover:border-cyan-300/70 hover:shadow-[0_0_40px_-6px_rgba(34,211,238,0.55)]";
const ghostBtn =
  "inline-flex min-h-[48px] min-w-[140px] items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-bold uppercase tracking-wide text-zinc-100 transition hover:border-cyan-400/35 hover:bg-white/[0.07]";

/**
 * Shown when there are zero published podcast episodes — not a 404.
 */
export function PodcastComingSoon() {
  return (
    <section
      className="relative z-10 border-b border-white/[0.06] px-5 py-16 sm:px-8 sm:py-20 md:py-24 lg:px-12 xl:px-16"
      aria-labelledby="podcast-empty-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(34,211,238,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_80%_70%,rgba(168,85,247,0.1),transparent_50%)]" />

      <div className="relative mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-cyan-400/85">
          Signal detected — standby
        </p>
        <h2
          id="podcast-empty-heading"
          className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Podcasts are still charging up…
        </h2>
        <div className="mt-8 space-y-4 text-left text-base leading-relaxed text-zinc-400 sm:text-lg">
          <p className="rounded-xl border border-cyan-400/20 bg-[#050a14]/80 px-5 py-4 text-cyan-100/95 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <span className="font-semibold text-cyan-200">The mic is warming up.</span>{" "}
            Episodes coming soon — we&apos;re calibrating the nerd council before we hit
            record.
          </p>
          <p className="rounded-xl border border-violet-400/15 bg-[#050a14]/60 px-5 py-4 text-zinc-300">
            Our nerd council has not entered the booth yet. When they do, you&apos;ll hear
            it here first — hot takes, breakdowns, and the chaos you signed up for.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link href="/" className={primaryBtn}>
            Back to Home
          </Link>
          <Link href="/#latest-heading" className={ghostBtn}>
            Latest stories
          </Link>
        </div>

        <p className="mt-10 text-xs text-zinc-600">
          Geek My Interest · Audio division · ETA: soon™
        </p>
      </div>
    </section>
  );
}
