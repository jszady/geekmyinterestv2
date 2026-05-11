import {
  isYouTubeHost,
  safeHttpUrl,
  toYouTubeEmbedUrl,
} from "@/lib/posts/section-video";

type Props = { url: string; sectionIndex: number };

const cardClass =
  "group flex w-full items-center justify-between gap-4 rounded-xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/[0.07] to-violet-500/[0.07] px-4 py-3 shadow-[0_0_24px_-10px_rgba(34,211,238,0.35)] transition hover:border-cyan-400/45 hover:from-cyan-500/10 hover:to-violet-500/10";

/**
 * YouTube → privacy-friendly iframe (16:9). Other platforms → external “Watch clip” card.
 */
export function SectionVideoEmbed({ url, sectionIndex }: Props) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const src = toYouTubeEmbedUrl(trimmed);
  if (src) {
    // Debug-safe guard: only allow canonical embed URLs.
    if (!src.startsWith("https://www.youtube.com/embed/")) return null;
    return (
      <div
        className="relative w-full overflow-hidden rounded-xl border border-white/[0.08] bg-black shadow-[0_0_28px_-12px_rgba(34,211,238,0.4)]"
        data-article-section-video={sectionIndex}
      >
        <div className="relative w-full max-w-full" style={{ aspectRatio: "16 / 9" }}>
          <iframe
            className="absolute inset-0 h-full w-full border-0"
            src={src}
            title="YouTube video player"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    );
  }

  // Prevent broken/blank YouTube iframes from invalid IDs/watch links.
  if (isYouTubeHost(trimmed)) return null;

  const href = safeHttpUrl(trimmed);
  if (!href) return null;

  return (
    <div data-article-section-video={sectionIndex}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        <span className="min-w-0 text-left">
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
            Clip / trailer
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-zinc-100">
            Watch clip
          </span>
          <span className="mt-1 block truncate text-xs text-zinc-500">{href}</span>
        </span>
        <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-200/90 transition group-hover:border-cyan-400/30 group-hover:text-cyan-100">
          Open →
        </span>
      </a>
    </div>
  );
}
