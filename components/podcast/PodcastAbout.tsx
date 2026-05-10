export function PodcastAbout() {
  return (
    <section
      className="relative z-10 border-b border-white/[0.06] py-14 sm:py-16 md:py-20"
      aria-labelledby="about-podcast-heading"
    >
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.35fr)] lg:items-start lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-400/75">
              About the show
            </p>
            <h2
              id="about-podcast-heading"
              className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl"
            >
              Loud opinions. Sharp context. Zero corporate fluff.
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-zinc-400 sm:text-lg">
              <p>
                The{" "}
                <strong className="font-semibold text-zinc-200">
                  Geek My Interest Podcast
                </strong>{" "}
                is where we break down the biggest stories in movies, anime,
                gaming, and pop culture — from hot takes and rankings to reactions,
                debates, and predictions we will absolutely revisit when we are
                wrong.
              </p>
              <p>
                Think of it as the after-show for your group chat: messy, funny,
                occasionally unhinged, but always grounded in what actually matters
                to fans — not press releases.
              </p>
            </div>
          </div>
          <aside className="rounded-xl border border-fuchsia-500/20 bg-gradient-to-b from-fuchsia-500/10 via-transparent to-cyan-400/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-fuchsia-200/90">
              You will hear
            </p>
            <ul className="mt-4 space-y-3 text-sm text-zinc-300">
              <li className="flex gap-2">
                <span className="text-cyan-400" aria-hidden>
                  ▸
                </span>
                Spoiler-aware breakdowns and season postmortems
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400" aria-hidden>
                  ▸
                </span>
                Industry moves that actually hit fandom
              </li>
              <li className="flex gap-2">
                <span className="text-cyan-400" aria-hidden>
                  ▸
                </span>
                The debates you are already having online — with receipts
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
