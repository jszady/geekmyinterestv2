import { editorialFeed } from "@/components/feed/featured-articles";
import { PostCard } from "@/components/feed/PostCard";

const DESKTOP_LEAD_GRID_STYLE = {
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gridTemplateRows: "auto auto auto",
  gridTemplateAreas: `
    "feat feat feat rtop"
    "feat feat feat rtop"
    "s1 s2 s3 rbottom"
  `,
} as const;

export function EditorialLeadSection() {
  const { featured, secondary } = editorialFeed;
  const [rt1, rt2, rt3, rt4, s1, s2, s3, rt5] = secondary;

  return (
    <section
      className="relative z-10 w-full pt-24 sm:pt-28 lg:pt-32"
      aria-labelledby="editorial-lead-heading"
    >
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <header className="mb-8 border-b border-white/[0.07] pb-6 md:mb-10 md:pb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-400/80">
            Front page
          </p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h1
              id="editorial-lead-heading"
              className="text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[2.35rem]"
            >
              Today’s top stories
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-zinc-500 md:text-right md:text-base">
              Lead coverage, trending picks, and what the geek world is talking
              about right now.
            </p>
          </div>
        </header>

        {/* Mobile / tablet: content-first stack + simple grid */}
        <div className="flex flex-col gap-5 lg:hidden">
          <div className="min-w-0">
            <PostCard {...featured} variant="featured" />
          </div>
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4"
            aria-label="Supporting stories"
          >
            {[rt1, rt2, rt3, rt4, s1, s2, s3, rt5].map((post) => (
              <PostCard key={post.href} {...post} variant="supporting" />
            ))}
          </div>
        </div>

        {/* Desktop: asymmetric editorial — right rail stacks four compact cards + one bottom cell */}
        <div
          className="hidden min-w-0 gap-x-5 gap-y-2.5 lg:grid xl:gap-x-6 xl:gap-y-3"
          style={DESKTOP_LEAD_GRID_STYLE}
          aria-label="Editorial lead layout"
        >
          <div className="min-h-0 min-w-0" style={{ gridArea: "feat" }}>
            <PostCard {...featured} variant="featured" />
          </div>
          <div
            className="flex min-h-0 min-w-0 flex-col gap-2 xl:gap-2.5"
            style={{ gridArea: "rtop" }}
          >
            <PostCard {...rt1} variant="supporting" railCompact />
            <PostCard {...rt2} variant="supporting" railCompact />
            <PostCard {...rt3} variant="supporting" railCompact />
            <PostCard {...rt4} variant="supporting" railCompact />
          </div>
          <div className="min-h-0 min-w-0" style={{ gridArea: "s1" }}>
            <PostCard {...s1} variant="supporting" />
          </div>
          <div className="min-h-0 min-w-0" style={{ gridArea: "s2" }}>
            <PostCard {...s2} variant="supporting" />
          </div>
          <div className="min-h-0 min-w-0" style={{ gridArea: "s3" }}>
            <PostCard {...s3} variant="supporting" />
          </div>
          <div className="min-h-0 min-w-0" style={{ gridArea: "rbottom" }}>
            <PostCard {...rt5} variant="supporting" railCompact />
          </div>
        </div>
      </div>
    </section>
  );
}
