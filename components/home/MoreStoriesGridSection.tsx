import { editorialFeed } from "@/components/feed/featured-articles";
import { PostCard } from "@/components/feed/PostCard";

export function MoreStoriesGridSection() {
  const { standard } = editorialFeed;

  return (
    <section
      className="relative z-10 border-t border-white/[0.06] py-12 sm:py-14 md:py-16 lg:py-20"
      aria-labelledby="more-stories-heading"
    >
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <header className="mb-8 md:mb-10 lg:mb-12">
          <h2
            id="more-stories-heading"
            className="text-xl font-bold tracking-tight text-white md:text-2xl"
          >
            More top stories
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 md:text-base">
            Reviews, analysis, and reporting from across the network.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-9 xl:grid-cols-4 xl:gap-10">
          {standard.map((post) => (
            <PostCard key={post.href} {...post} variant="standard" />
          ))}
        </div>
      </div>
    </section>
  );
}
