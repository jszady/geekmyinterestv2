import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import type { PostCardData } from "@/components/feed/types";
import { postRowToCardData } from "@/lib/posts/map-row-to-card";
import {
  fetchProfileByUsername,
  fetchPublishedPostsByAuthorId,
} from "@/lib/posts/queries";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { username: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const profile = await fetchProfileByUsername(decoded);
  const name = profile?.username ?? decoded;
  return { title: `${name} — Authors — Geek My Interest` };
}

export default async function AuthorPage({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const profile = await fetchProfileByUsername(decoded);
  if (!profile?.id) notFound();

  const posts = await fetchPublishedPostsByAuthorId(profile.id);
  const cards: PostCardData[] = await Promise.all(posts.map((p) => postRowToCardData(p)));

  const display = profile.username?.trim() || "Author";

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-[1800px] px-5 pb-20 pt-28 sm:px-8 lg:px-12 xl:px-16">
        <header className="border-b border-white/[0.07] pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Author
          </p>
          <h1
            className="mt-2 text-3xl font-bold text-white md:text-4xl"
            style={{ textShadow: "0 0 18px rgba(34,211,238,0.3)" }}
          >
            {display}
          </h1>
        </header>

        <section className="mt-10" aria-label="Published posts">
          <h2 className="text-lg font-bold text-white">Published work</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  className="group block overflow-hidden rounded-xl border border-white/[0.08] bg-[#050a14]/80 shadow-[0_0_20px_-8px_rgba(34,211,238,0.35)] transition hover:border-cyan-400/35"
                >
                  <div className="relative aspect-[16/10] w-full bg-zinc-900">
                    <Image
                      src={c.image.src}
                      alt={c.image.alt}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
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
          {!cards.length ? (
            <p className="mt-6 text-sm text-zinc-500">No published posts yet.</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
