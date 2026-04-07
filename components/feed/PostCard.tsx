import Image from "next/image";
import Link from "next/link";
import type { PostCardData, PostCardVariant } from "./types";

const topBarClip = "polygon(0.85rem 0, 100% 0, 100% 100%, 0 100%, 0 0.65rem)";

type PostCardProps = PostCardData & { variant?: PostCardVariant };

/** Class strings must appear as explicit literals in this file so Tailwind emits them. */
function postCardFrameClasses(variant: PostCardVariant) {
  if (variant === "featured") {
    return {
      aspect:
        "aspect-[16/11] sm:aspect-[16/10] lg:aspect-[5/4] xl:aspect-[16/11]",
      glow: "shadow-[0_0_16px_-2px_rgba(217,70,239,0.48),0_0_22px_-4px_rgba(34,211,238,0.34),inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:shadow-[0_0_24px_-1px_rgba(217,70,239,0.58),0_0_30px_-3px_rgba(34,211,238,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]",
      categoryBar: "px-4 py-3 sm:py-3.5",
      categoryText:
        "text-[11px] tracking-[0.26em] sm:text-xs sm:tracking-[0.24em] lg:text-[0.8rem]",
      titleBar: "px-4 py-4 sm:px-5 sm:py-5 lg:py-5",
      titleText:
        "text-base font-bold leading-snug sm:text-lg lg:text-xl xl:text-[1.35rem] line-clamp-4",
      imageSizes:
        "(max-width: 1024px) 100vw, (max-width: 1536px) 58vw, 900px",
    };
  }
  if (variant === "secondary") {
    return {
      aspect: "aspect-[3/2] sm:aspect-[3/2] lg:aspect-[7/5]",
      glow: "shadow-[0_0_12px_-2px_rgba(217,70,239,0.4),0_0_16px_-4px_rgba(34,211,238,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:shadow-[0_0_18px_-1px_rgba(217,70,239,0.52),0_0_22px_-3px_rgba(34,211,238,0.38),inset_0_1px_0_rgba(255,255,255,0.08)]",
      categoryBar: "px-3 py-2 sm:px-3.5 sm:py-2.5",
      categoryText:
        "text-[9px] tracking-[0.24em] sm:text-[10px] sm:tracking-[0.22em]",
      titleBar: "px-3 py-2.5 sm:px-3.5 sm:py-3",
      titleText:
        "text-[0.8rem] font-bold leading-snug sm:text-[0.85rem] line-clamp-2 lg:line-clamp-2",
      imageSizes:
        "(max-width: 1024px) 100vw, (max-width: 1536px) 36vw, 480px",
    };
  }
  return {
    aspect: "aspect-[3/4]",
    glow: "shadow-[0_0_14px_-2px_rgba(217,70,239,0.45),0_0_18px_-4px_rgba(34,211,238,0.32),inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:shadow-[0_0_20px_-1px_rgba(217,70,239,0.55),0_0_26px_-3px_rgba(34,211,238,0.42),inset_0_1px_0_rgba(255,255,255,0.08)]",
    categoryBar: "px-3.5 py-2.5 sm:px-4 sm:py-3",
    categoryText:
      "text-[10px] tracking-[0.28em] sm:text-[11px] sm:tracking-[0.26em]",
    titleBar: "px-3.5 py-3 sm:px-4 sm:py-3.5",
    titleText:
      "text-[0.9rem] font-bold leading-snug sm:text-[0.95rem] lg:text-base line-clamp-3",
    imageSizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw",
  };
}

export function PostCard({ variant = "standard", ...data }: PostCardProps) {
  const { href, title, category, image } = data;
  const c = postCardFrameClasses(variant);

  return (
    <Link
      href={href}
      data-post-variant={variant}
      className="group block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#02040d]"
    >
      <article
        className="relative h-full w-full origin-center transition-transform duration-300 ease-out group-hover:scale-[1.012] motion-reduce:transform-none motion-reduce:transition-none"
        aria-label={`${title} — ${category}`}
      >
        <div
          className={
            "relative w-full rounded-lg bg-gradient-to-b from-fuchsia-500/[0.5] via-cyan-400/[0.38] to-fuchsia-500/[0.48] p-px transition-[box-shadow] duration-300 ease-out motion-reduce:transition-none " +
            c.aspect +
            " " +
            c.glow
          }
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[7px] bg-[#040812]">
            <div
              className={
                "relative z-[1] shrink-0 border-b border-fuchsia-500/15 bg-gradient-to-r from-[#050a14] via-[#070d18] to-[#050a14] " +
                c.categoryBar
              }
              style={{ clipPath: topBarClip }}
            >
              <span
                className={
                  "block text-center font-bold uppercase text-white/95 " +
                  c.categoryText
                }
                style={{
                  textShadow:
                    "0 0 14px rgba(34,211,238,0.35), 0 0 22px rgba(217,70,153,0.2), 1px 0 0 rgba(244,114,182,0.25), -1px 0 0 rgba(34,211,238,0.2)",
                }}
              >
                {category}
              </span>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden bg-zinc-950">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-[transform] duration-500 ease-out group-hover:scale-[1.045] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                sizes={c.imageSizes}
              />
              <div
                className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#040812]/95 via-transparent to-[#040812]/25"
                aria-hidden
              />
            </div>

            <div
              className={
                "relative z-[1] shrink-0 border-t border-cyan-400/15 bg-[#050a14]/92 backdrop-blur-[2px] " +
                c.titleBar
              }
            >
              <h3
                className={"text-left tracking-tight text-zinc-100 " + c.titleText}
              >
                {title}
              </h3>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
