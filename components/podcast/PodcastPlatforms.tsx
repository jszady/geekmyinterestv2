import { listenPlatforms } from "@/lib/podcast/data";
import { isExternalUrl } from "@/lib/social/official-links";

const platformAccents: Record<
  string,
  { hover: string; arrowHover: string; dot: string }
> = {
  youtube: {
    hover:
      "hover:border-[#FF0000]/25 hover:shadow-[0_0_28px_-10px_rgba(255,0,0,0.4)]",
    arrowHover: "group-hover:text-[#FF0000]",
    dot: "bg-[#FF0000]",
  },
  spotify: {
    hover:
      "hover:border-[#1DB954]/25 hover:shadow-[0_0_28px_-10px_rgba(29,185,84,0.4)]",
    arrowHover: "group-hover:text-[#1DB954]",
    dot: "bg-[#1DB954]",
  },
  apple: {
    hover:
      "hover:border-[#FA243C]/25 hover:shadow-[0_0_28px_-10px_rgba(250,36,60,0.4)]",
    arrowHover: "group-hover:text-[#FA243C]",
    dot: "bg-[#FA243C]",
  },
  tiktok: {
    hover:
      "hover:border-white/20 hover:shadow-[0_0_28px_-10px_rgba(255,255,255,0.15)]",
    arrowHover: "group-hover:text-cyan-300",
    dot: "bg-white",
  },
};

const fallbackAccent = {
  hover:
    "hover:border-cyan-400/30 hover:shadow-[0_0_28px_-12px_rgba(34,211,238,0.35)]",
  arrowHover: "group-hover:text-cyan-300",
  dot: "bg-cyan-400",
};

export function PodcastPlatforms() {
  return (
    <section
      id="listen"
      className="relative z-10 border-b border-white/[0.06] py-14 sm:py-16 md:py-20"
      aria-labelledby="listen-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_50%_0%,rgba(168,85,247,0.08),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-violet-300/80">
          Distribution
        </p>
        <h2
          id="listen-heading"
          className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl"
        >
          Where to listen
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Pick your lane — full episodes, audio-only, or bite-sized clips. Same
          show, same energy, zero gatekeeping about how you tune in.
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listenPlatforms.map((p) => {
            const accent = platformAccents[p.id] ?? fallbackAccent;
            return (
              <li key={p.id}>
                {p.href && isExternalUrl(p.href) ? (
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex h-full flex-col rounded-xl border border-white/[0.08] bg-[#040812]/85 p-5 transition duration-200 ${accent.hover}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full opacity-60 transition-opacity duration-200 group-hover:opacity-100 ${accent.dot}`}
                        aria-hidden
                      />
                      <span className="text-lg font-bold text-white">
                        {p.label}
                      </span>
                    </div>
                    <span className="mt-1 text-sm text-zinc-500">
                      {p.description}
                    </span>
                    <span
                      className={`mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-600 transition-colors duration-200 ${accent.arrowHover}`}
                    >
                      Open →
                    </span>
                  </a>
                ) : (
                  <div className="group flex h-full flex-col rounded-xl border border-white/[0.08] bg-[#040812]/85 p-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full opacity-60 ${accent.dot}`}
                        aria-hidden
                      />
                      <span className="text-lg font-bold text-white">
                        {p.label}
                      </span>
                    </div>
                    <span className="mt-1 text-sm text-zinc-500">
                      {p.description}
                    </span>
                    <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-700">
                      Episode links only
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
