import type { PostCardData } from "@/components/feed/types";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { postRowToCardData } from "@/lib/posts/map-row-to-card";
import { fetchPublishedPostsByTagSlug, fetchTagBySlug } from "@/lib/tags/queries";
import Image from "next/image";
import Link from "next/link";
import { getPublicSiteUrl } from "@/lib/site-public-url";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const siteUrl = getPublicSiteUrl();

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const tag = await fetchTagBySlug(decoded);
  if (!tag) return { title: "Tag" };
  const description = `Articles tagged "${tag.name}" on Geek My Interest.`;
  return {
    title: `${tag.name}  —  Tags`,
    description,
    alternates: { canonical: `${siteUrl}/tag/${tag.slug}` },
    openGraph: {
      title: `${tag.name}  —  Geek My Interest`,
      description,
      url: `${siteUrl}/tag/${tag.slug}`,
      type: "website",
    },
    twitter: { card: "summary" },
  };
}

export default async function TagArchivePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const tag = await fetchTagBySlug(decoded);
  if (!tag) notFound();

  const posts = await fetchPublishedPostsByTagSlug(tag.slug);
  const cards: PostCardData[] = await Promise.all(posts.map((p) => postRowToCardData(p)));

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-[1800px] px-5 pb-20 pt-28 sm:px-8 lg:px-12 xl:px-16">
        <header className="border-b border-white/[0.07] pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Tag</p>
          <h1
            className="mt-2 text-3xl font-bold text-white md:text-4xl"
            style={{ textShadow: "0 0 18px rgba(139,92,246,0.28)" }}
          >
            {tag.name}
          </h1>
          <p className="mt-2 font-mono text-xs text-zinc-500">/{tag.slug}</p>
        </header>

        <section className="mt-10" aria-label="Posts with this tag">
          <h2 className="text-lg font-bold text-white">Posts</h2>
          {cards.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">No published posts use this tag yet.</p>
          ) : (
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="group block overflow-hidden rounded-xl border border-white/[0.08] bg-[#050a14]/80 shadow-[0_0_20px_-8px_rgba(139,92,246,0.3)] transition hover:border-violet-400/35"
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
                      <h3 className="text-base font-bold leading-snug text-white group-hover:text-violet-100">
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
