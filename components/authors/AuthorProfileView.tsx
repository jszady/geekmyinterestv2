import type { PostCardData } from "@/components/feed/types";
import { AuthorHeaderImage } from "@/components/authors/AuthorHeaderImage";
import { UserAvatar } from "@/components/profile/UserAvatar";
import Image from "next/image";
import Link from "next/link";

export type AuthorArticle = PostCardData & {
  dateLabel: string;
};

type Props = {
  displayName: string;
  avatarUrl: string | null;
  /** Resolved public URL for the hero banner (server-normalized); null = gradient only. */
  authorHeaderImageUrl: string | null;
  bio: string | null;
  memberSinceLabel: string;
  articles: AuthorArticle[];
};

export function AuthorProfileView({
  displayName,
  avatarUrl,
  authorHeaderImageUrl,
  bio,
  memberSinceLabel,
  articles,
}: Props) {
  const featured = articles.slice(0, 3);
  const rest = articles.slice(3);

  return (
    <div className="relative z-10">
      {/* HERO */}
      <section
        className="relative min-h-[420px] overflow-hidden rounded-3xl"
        aria-labelledby="author-hero-heading"
      >
        {authorHeaderImageUrl ? (
          <AuthorHeaderImage src={authorHeaderImageUrl} />
        ) : (
          <div className="absolute inset-0 z-0 bg-[#030510]" aria-hidden />
        )}

        <div
          className="pointer-events-none absolute inset-0 z-10 bg-black/40"
          aria-hidden
        />

        <div className="relative z-20 px-6 pb-12 pt-14 sm:px-10 sm:pb-14 sm:pt-16 md:px-12 md:pb-16 md:pt-20">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center md:flex-row md:items-end md:gap-12 md:text-left">
            <div className="relative shrink-0">
              <UserAvatar
                username={displayName}
                avatarUrl={avatarUrl}
                size="hero"
                decorative={false}
                className="relative shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              />
            </div>

            <div className="mt-10 min-w-0 flex-1 md:mt-0 md:pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/75">
                Geek My Interest
              </p>
              <h1
                id="author-hero-heading"
                className="mt-3 font-bold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.05]"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                }}
              >
                {displayName}
              </h1>
              <p className="mt-3 text-sm font-medium text-violet-200/85 sm:text-base">
                Staff Writer · Entertainment & culture
              </p>
              <p className="mt-2 inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-black/50 bg-black/55 px-3 py-1.5 text-xs font-medium text-zinc-100 shadow-[0_2px_12px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:text-sm md:justify-start">
                <span className="text-zinc-300">Member since</span>
                <span className="text-white">{memberSinceLabel}</span>
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <a
                  href="#published-work"
                  className="inline-flex items-center justify-center rounded-lg border border-cyan-400/35 bg-cyan-500/[0.08] px-5 py-2.5 text-sm font-semibold text-cyan-100 shadow-[0_0_24px_-8px_rgba(34,211,238,0.35)] transition hover:border-cyan-300/50 hover:bg-cyan-500/12"
                >
                  Published work
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700/90 bg-black/55 px-5 py-2.5 text-sm font-semibold text-zinc-50 shadow-[0_2px_16px_rgba(0,0,0,0.5)] backdrop-blur-sm transition hover:border-zinc-500 hover:bg-black/70 hover:text-white"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mt-10 rounded-2xl border border-white/[0.06] bg-[#050a14]/55 px-6 py-8 backdrop-blur-sm sm:px-8 sm:py-10"
        aria-labelledby="author-bio-heading"
      >
        <h2
          id="author-bio-heading"
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300/80"
        >
          Bio
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-zinc-300 sm:text-base">
          {(bio ?? "").trim() ? (
            bio.trim()
          ) : (
            <span className="italic text-zinc-500">No bio added yet.</span>
          )}
        </p>
      </section>

      {/* PUBLISHED WORK */}
      <section
        id="published-work"
        className="mt-14 scroll-mt-28 sm:scroll-mt-32"
        aria-labelledby="published-work-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <h2
              id="published-work-heading"
              className="text-2xl font-bold tracking-tight text-white md:text-3xl"
              style={{ textShadow: "0 0 20px rgba(139,92,246,0.12)" }}
            >
              Published work
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500">
              {articles.length === 0
                ? "New pieces drop here first."
                : `${articles.length} article${articles.length === 1 ? "" : "s"} on site`}
            </p>
          </div>
        </div>

        {articles.length === 0 ? (
          <p className="mt-10 rounded-xl border border-white/[0.06] bg-[#050a14]/40 px-6 py-10 text-center text-sm text-zinc-500">
            No published posts yet. Check back soon — the good stuff is worth the wait.
          </p>
        ) : (
          <>
            {featured.length > 0 ? (
              <ul className="mt-10 grid gap-6 md:grid-cols-3">
                {featured.map((c) => (
                  <li key={c.href}>
                    <Link
                      href={c.href}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#050a14]/70 shadow-[0_0_0_1px_rgba(34,211,238,0.04)] transition hover:border-cyan-400/25 hover:shadow-[0_12px_40px_-16px_rgba(34,211,238,0.15)]"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                        <Image
                          src={c.image.src}
                          alt={c.image.alt}
                          fill
                          className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-[#02040d] via-transparent to-transparent opacity-90"
                          aria-hidden
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/90">
                            {c.category}
                          </p>
                          <h3 className="mt-1.5 text-lg font-bold leading-snug text-white group-hover:text-cyan-50">
                            {c.title}
                          </h3>
                          {c.excerpt ? (
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                              {c.excerpt}
                            </p>
                          ) : null}
                          <p className="mt-2 text-[11px] font-medium text-zinc-500">{c.dateLabel}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {rest.length > 0 ? (
              <ul className="mt-10 space-y-0" aria-label="More articles">
                {rest.map((c) => (
                  <li
                    key={c.href}
                    className="border-b border-white/[0.06] last:border-b-0"
                  >
                    <Link
                      href={c.href}
                      className="group flex gap-4 py-5 sm:gap-6 sm:py-6"
                    >
                      <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-zinc-900 sm:h-28 sm:w-44">
                        <Image
                          src={c.image.src}
                          alt={c.image.alt}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                          sizes="176px"
                        />
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300/85">
                          {c.category}
                        </p>
                        <h3 className="mt-1 text-base font-bold leading-snug text-white group-hover:text-cyan-100 sm:text-lg">
                          {c.title}
                        </h3>
                        {c.excerpt ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                            {c.excerpt}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs text-zinc-600">{c.dateLabel}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
