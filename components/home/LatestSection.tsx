"use client";

import { editorialFeed } from "@/components/feed/featured-articles";
import type { PostCardData, PostCategory } from "@/components/feed/types";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type LatestFilterId = "all" | "movies" | "tv" | "anime" | "gaming";

const FILTERS: { id: LatestFilterId; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "movies", label: "MOVIES" },
  { id: "tv", label: "TV" },
  { id: "anime", label: "ANIME" },
  { id: "gaming", label: "GAMING" },
];

function postMatchesFilter(post: PostCardData, filter: LatestFilterId): boolean {
  if (filter === "all") return true;
  if (filter === "movies") return post.category === "Movie";
  if (filter === "tv") return post.category === "Show";
  if (filter === "anime") return post.category === "Anime";
  if (filter === "gaming") return post.category === "Game";
  return false;
}

function CommentGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M7 18.5C5.62 18.5 4.5 17.38 4.5 16V7C4.5 5.62 5.62 4.5 7 4.5H17C18.38 4.5 19.5 5.62 19.5 7V13C19.5 14.38 18.38 15.5 17 15.5H10.5L7 18.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LatestSection() {
  const posts = editorialFeed.latest;
  const [active, setActive] = useState<LatestFilterId>("all");
  const visible = useMemo(
    () => posts.filter((post) => postMatchesFilter(post, active)),
    [posts, active],
  );

  return (
    <section
      className="relative z-10 border-t border-white/[0.06] py-12 sm:py-14 md:py-16 lg:py-20"
      aria-labelledby="latest-heading"
    >
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <h2
          id="latest-heading"
          className="text-2xl font-bold tracking-tight text-white md:text-[1.65rem]"
        >
          LATEST
        </h2>

        <div
          className="mt-5 flex flex-wrap gap-2 md:mt-6"
          role="tablist"
          aria-label="Filter latest stories by topic"
        >
          {FILTERS.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(id)}
                className={
                  "rounded-md px-3.5 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:text-[13px] " +
                  (isActive
                    ? "bg-cyan-400 text-[#02040d] shadow-[0_0_20px_-4px_rgba(34,211,238,0.55)]"
                    : "bg-white/[0.06] text-zinc-200 hover:bg-white/[0.1]")
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        <ul className="mt-8 divide-y divide-white/[0.06] md:mt-10">
          {visible.map((post) => (
            <li key={post.href} className="py-6 first:pt-0 md:py-7">
              <LatestRow post={post} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function categoryChannel(cat: PostCategory): string {
  switch (cat) {
    case "Movie":
      return "MOVIES";
    case "Show":
      return "TV";
    case "Anime":
      return "ANIME";
    case "Game":
      return "GAMING";
    default:
      return cat;
  }
}

function LatestRow({ post }: { post: PostCardData }) {
  const excerpt =
    post.excerpt ?? post.title.slice(0, 140) + (post.title.length > 140 ? "…" : "");
  const byline = post.author ?? "Staff";
  const when = post.timeLabel ?? "Recently";

  return (
    <Link
      href={post.href}
      className="group flex gap-5 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#02040d] sm:gap-6"
    >
      <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-md bg-zinc-900 shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_18px_-6px_rgba(217,70,239,0.35)] sm:h-32 sm:w-48">
        <Image
          src={post.image.src}
          alt={post.image.alt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          sizes="(max-width: 640px) 144px, 192px"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-500 sm:text-sm">
          {when}
          <span className="mx-1.5 text-zinc-600">·</span>
          <span className="text-cyan-400/90">{categoryChannel(post.category)}</span>
        </p>
        <h3 className="mt-1.5 text-lg font-bold leading-snug tracking-tight text-white group-hover:text-cyan-100 sm:text-[1.45rem]">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-base leading-relaxed text-zinc-400">
          {excerpt}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-zinc-200">By {byline}</span>
          <span className="hidden h-3 w-px bg-zinc-600 sm:inline" aria-hidden />
          <span className="flex items-center gap-1 text-zinc-500">
            <CommentGlyph className="text-zinc-500" />
            <span className="sr-only">Discussion</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
