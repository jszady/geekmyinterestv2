import type { PostCardData } from "@/components/feed/types";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { postRowToCardData } from "@/lib/posts/map-row-to-card";
import { fetchPublishedPostsByCategory } from "@/lib/posts/queries";
import Image from "next/image";
import Link from "next/link";
import { getPublicSiteUrl } from "@/lib/site-public-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const siteUrl = getPublicSiteUrl();

const SLUG_TO_DB: Record<string, string> = {
  movies: "Movie",
  anime: "Anime",
  shows: "Show",
  games: "Game",
  tech: "Tech",
};

const SLUG_TO_LABEL: Record<string, string> = {
  movies: "Movies",
  anime: "Anime",
  shows: "Shows",
  games: "Games",
  tech: "Tech",
};

type Params = { slug: string };

export function generateStaticParams() {
  return Object.keys(SLUG_TO_DB).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const label = SLUG_TO_LABEL[slug];
  if (!label) return { title: "Category — Geek My Interest" };
  return {
    title: `${label} Articles`,
    description: `Browse all ${label.toLowerCase()} reviews, news, and analysis on Geek My Interest.`,
    alternates: { canonical: `${siteUrl}/category/${slug}` },
    openGraph: {
      title: `${label} — Geek My Interest`,
      description: `Browse all ${label.toLowerCase()} reviews, news, and analysis on Geek My Interest.`,
      url: `${siteUrl}/category/${slug}`,
      type: "website",
    },
    twitter: { card: "summary" },
  };
}

export default async function CategoryArchivePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const dbCategory = SLUG_TO_DB[slug];
  const label = SLUG_TO_LABEL[slug];
  if (!dbCategory) notFound();

  const posts = await fetchPublishedPostsByCategory(dbCategory);
  const cards: PostCardData[] = await Promise.all(posts.map((p) => postRowToCardData(p)));

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-[1800px] px-5 pb-20 pt-28 sm:px-8 lg:px-12 xl:px-16">
        <header className="border-b border-white/[0.07] pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Category</p>
          <h1
            className="mt-2 text-3xl font-bold text-white md:text-4xl"
            style={{ textShadow: "0 0 18px rgba(34,211,238,0.28)" }}
          >
            {label}
          </h1>
        </header>

        <section className="mt-10" aria-label={`${label} posts`}>
          {cards.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">No published posts in this category yet.</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="group block overflow-hidden rounded-xl border border-white/[0.08] bg-[#050a14]/80 shadow-[0_0_20px_-8px_rgba(34,211,238,0.3)] transition hover:border-cyan-400/35"
                  >
                    <div className="relative aspect-[16/10] w-full bg-zinc-900">
                      <Image
                        src={c.image.src}
                        alt={c.image.alt}
                        fill
                        className="object-cover object-[center_22%] transition duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="space-y-1 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/90">
                        {c.category}
                      </p>
                      <h3 className="text-base font-bold leading-snug text-white group-hover:text-cyan-100">
                        {c.title}
                      </h3>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
