import { SubscribeForm } from "@/components/landing/SubscribeForm";
import { listenPlatforms } from "@/lib/podcast/data";
import { isExternalUrl } from "@/lib/social/official-links";

const platformPillHover: Record<string, string> = {
  youtube: "hover:border-[#FF0000]/30 hover:text-[#FF0000]",
  spotify: "hover:border-[#1DB954]/30 hover:text-[#1DB954]",
  apple: "hover:border-[#FA243C]/30 hover:text-[#FA243C]",
  tiktok: "hover:border-cyan-400/35 hover:text-cyan-300",
};

export function PodcastSubscribeCta() {
  return (
    <section
      className="relative z-10 py-16 sm:py-20 lg:py-24"
      aria-labelledby="podcast-subscribe-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_70%_80%,rgba(139,92,246,0.1),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_30%,rgba(34,211,238,0.07),transparent_50%)]" />

      <div className="relative mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="rounded-2xl border border-white/[0.08] bg-[#030814]/90 p-8 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-14">
            <div className="space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-400/75">
                Stay in the loop
              </p>
              <h2
                id="podcast-subscribe-heading"
                className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                Never miss an episode
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
                Subscribe for drops, watch parties, and the kind of geek news
                rundowns that make your commute feel shorter — then tell your
                friends we sent you.
              </p>
              <SubscribeForm />
            </div>

            <div className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-6">
              <p className="text-sm font-semibold text-zinc-200">Jump back in</p>
              <div className="flex flex-wrap gap-2">
                {listenPlatforms.map((p) =>
                  p.href && isExternalUrl(p.href) ? (
                    <a
                      key={p.id}
                      href={p.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-full border border-white/12 bg-[#040812]/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-300 transition duration-200 ${platformPillHover[p.id] ?? "hover:border-cyan-400/35 hover:text-white"}`}
                    >
                      {p.label}
                    </a>
                  ) : (
                    <span
                      key={p.id}
                      className="rounded-full border border-white/12 bg-[#040812]/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500"
                    >
                      {p.label}
                    </span>
                  ),
                )}
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                New episodes weekly-ish — whenever the culture moves fast enough
                to deserve a mic.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
