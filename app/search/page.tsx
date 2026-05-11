import { PostCard } from "@/components/feed/PostCard";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { postRowToCardData } from "@/lib/posts/map-row-to-card";
import { searchPublishedPostRows } from "@/lib/posts/search-published";
import { Search } from "lucide-react";
import type { Metadata } from "next";

type PageProps = {
  searchParams?: Promise<{ q?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = searchParams ? await searchParams : undefined;
  const q = typeof sp?.q === "string" ? sp.q : Array.isArray(sp?.q) ? sp.q[0] : "";
  const title = q.trim() ? `"${q.trim()}"  —  Search` : "Search";
  return {
    title: `${title}  —  Geek My Interest`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const raw = typeof sp?.q === "string" ? sp.q : Array.isArray(sp?.q) ? sp.q[0] : "";
  const q = raw.trim();
  const rows = q.length >= 2 ? await searchPublishedPostRows(q, 60) : [];
  const cards = await Promise.all(rows.map((r) => postRowToCardData(r)));

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <div className="relative z-10 mx-auto w-full max-w-[1800px] px-5 pb-24 pt-24 sm:px-8 sm:pt-28 lg:px-12 xl:px-16">
        <header className="border-b border-white/[0.07] pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-cyan-300/85">Search</p>
          <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            {q.length >= 2 ? (
              <>
                Results for <span className="text-cyan-200">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              "Search articles"
            )}
          </h1>
          <form action="/search" method="get" className="relative mt-4 max-w-xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search className="h-5 w-5" strokeWidth={2} />
            </span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search articles..."
              className="w-full rounded-lg border border-white/[0.1] bg-[#050a14]/95 py-2.5 pl-11 pr-10 text-sm text-zinc-100 shadow-inner shadow-black/30 outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/45 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.12)]"
            />
          </form>
          {q.length > 0 && q.length < 2 ? (
            <p className="mt-2 text-sm text-zinc-500">Enter at least 2 characters to search.</p>
          ) : null}
        </header>

        {q.length >= 2 && cards.length === 0 ? (
          <p className="mt-12 text-center text-sm text-zinc-500">No results found.</p>
        ) : null}

        {cards.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-9">
            {cards.map((post) => (
              <PostCard key={post.href} {...post} variant="standard" />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
