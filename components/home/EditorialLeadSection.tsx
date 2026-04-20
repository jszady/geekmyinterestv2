import { editorialFeed } from "@/components/feed/featured-articles";
import { PostCard } from "@/components/feed/PostCard";

const DESKTOP_LEAD_GRID_STYLE = {
  gridTemplateColumns: "minmax(0, 2.7fr) minmax(0, 1.3fr)",
  gridTemplateRows: "auto",
  gridTemplateAreas: `
    "left rtop"
  `,
} as const;

export function EditorialLeadSection() {
  const { featured, secondary } = editorialFeed;
  const [rt1, rt2, rt3, s1, s2, s3] = secondary;

  return (
    <section
      className="relative z-10 w-full pt-24 sm:pt-28 lg:pt-32"
      aria-labelledby="editorial-lead-heading"
    >
      <div className="mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <header className="mb-8 border-b border-white/[0.07] pb-6 md:mb-10 md:pb-8">
          <h1
            id="editorial-lead-heading"
            className="[font-family:var(--font-press-start),ui-monospace,monospace] text-xl font-normal leading-snug tracking-wide text-white sm:text-2xl md:text-[1.65rem]"
            style={{ textShadow: "0 0 18px rgba(34,211,238,0.35)" }}
          >
            TOP STORIES
          </h1>
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
            {[rt1, rt2, rt3, s1, s2, s3].map((post) => (
              <PostCard key={post.href} {...post} variant="supporting" />
            ))}
          </div>
        </div>

        {/* Desktop: lead story + aligned lower trio with 3-card rail */}
        <div
          className="hidden min-w-0 gap-x-5 gap-y-2.5 lg:grid xl:gap-x-6 xl:gap-y-3"
          style={DESKTOP_LEAD_GRID_STYLE}
          aria-label="Editorial lead layout"
        >
          <div className="min-h-0 min-w-0 flex flex-col gap-2.5 xl:gap-3" style={{ gridArea: "left" }}>
            <div className="min-h-0 min-w-0">
              <PostCard {...featured} variant="featured" />
            </div>
            <div className="grid min-h-0 min-w-0 grid-cols-3 gap-2.5 xl:gap-3">
              <div className="min-h-0 min-w-0">
                <PostCard {...s1} variant="supporting" />
              </div>
              <div className="min-h-0 min-w-0">
                <PostCard {...s2} variant="supporting" />
              </div>
              <div className="min-h-0 min-w-0">
                <PostCard {...s3} variant="supporting" />
              </div>
            </div>
          </div>
          <div
            className="flex min-h-0 min-w-0 flex-col gap-2 xl:gap-2.5"
            style={{ gridArea: "rtop" }}
          >
            <PostCard {...rt1} variant="supporting" railCompact />
            <PostCard {...rt2} variant="supporting" railCompact />
            <PostCard {...rt3} variant="supporting" railCompact />
          </div>
        </div>
      </div>
    </section>
  );
}
