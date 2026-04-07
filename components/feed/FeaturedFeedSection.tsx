import { editorialFeed } from "./featured-articles";
import { PostCard } from "./PostCard";

export function FeaturedFeedSection() {
  const { featured, secondary, standard } = editorialFeed;

  return (
    <section
      className="relative z-10 border-t border-white/[0.06] bg-[#02040d]/90 py-14 sm:py-16 md:py-20 lg:py-24"
      aria-labelledby="featured-feed-heading"
    >
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <header className="mb-10 max-w-3xl md:mb-12 lg:mb-14">
          <h2
            id="featured-feed-heading"
            className="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-[2rem]"
          >
            Latest stories
          </h2>
          <p className="mt-2 text-base leading-relaxed text-zinc-500 md:text-lg">
            News, reviews, and deep dives from across movies, shows, anime, and
            games — updated around the clock.
          </p>
        </header>

        {/* Mobile / tablet: editorial order — lead first, then supporting, then grid */}
        <div className="flex flex-col gap-8 lg:gap-10">
          {/* Top band: featured + secondary stack (desktop); stacked on small screens */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-stretch lg:gap-8 xl:gap-10">
            <div className="min-w-0">
              <PostCard {...featured} variant="featured" />
            </div>
            <div className="flex min-w-0 flex-col gap-6 sm:gap-7 lg:gap-5">
              {secondary.map((post) => (
                <PostCard key={post.href} {...post} variant="secondary" />
              ))}
            </div>
          </div>

          {/* Standard row — continues the homepage below the lead block */}
          <div
            className="grid grid-cols-1 gap-8 border-t border-white/[0.04] pt-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-9 lg:pt-12 xl:grid-cols-4 xl:gap-10"
            aria-label="More stories"
          >
            {standard.map((post) => (
              <PostCard key={post.href} {...post} variant="standard" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
