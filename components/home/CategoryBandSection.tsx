import type { PostCardData, PostCategory } from "@/components/feed/types";
import { PostCard } from "@/components/feed/PostCard";

type CategoryBandSectionProps = {
  id: string;
  label: PostCategory;
  title: string;
  description?: string;
  posts: PostCardData[];
};

export function CategoryBandSection({
  id,
  label,
  title,
  description,
  posts,
}: CategoryBandSectionProps) {
  return (
    <section
      id={id}
      className="relative z-10 border-t border-white/[0.06] py-12 sm:py-14 md:py-16 lg:py-20"
      aria-labelledby={`${id}-heading`}
    >
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <header className="mb-8 flex flex-col gap-2 border-b border-white/[0.06] pb-6 md:mb-10 md:flex-row md:items-end md:justify-between md:pb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-fuchsia-300/85">
              {label}
            </p>
            <h2
              id={`${id}-heading`}
              className="mt-1.5 text-2xl font-bold tracking-tight text-white md:text-3xl"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-xl text-sm text-zinc-500 md:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-9">
          {posts.map((post) => (
            <PostCard key={post.href} {...post} variant="standard" />
          ))}
        </div>
      </div>
    </section>
  );
}
