import Image from "next/image";
import Link from "next/link";
import type { PodcastEpisodeView } from "@/lib/podcast/data";

type EpisodeCardProps = {
  episode: PodcastEpisodeView;
};

const platformLinks = [
  {
    id: "youtube",
    label: "Watch on YouTube",
    key: "youtubeUrl" as const,
    className:
      "text-zinc-400 hover:text-[#FF0000] hover:underline hover:decoration-[#FF0000]/60 hover:underline-offset-2",
  },
  {
    id: "spotify",
    label: "Listen on Spotify",
    key: "spotifyUrl" as const,
    className:
      "text-zinc-400 hover:text-[#1DB954] hover:underline hover:decoration-[#1DB954]/60 hover:underline-offset-2",
  },
  {
    id: "apple-music",
    label: "Apple Music",
    key: "appleMusicUrl" as const,
    className:
      "text-zinc-400 hover:text-[#FA243C] hover:underline hover:decoration-[#FA243C]/60 hover:underline-offset-2",
  },
] as const;

export function EpisodeCard({ episode }: EpisodeCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-xl border border-white/[0.07] bg-[#050a14]/80 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition duration-200 hover:border-cyan-400/25 hover:shadow-[0_0_32px_-10px_rgba(34,211,238,0.3)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-xl border-b border-white/[0.06] bg-zinc-950">
        <Image
          src={episode.thumbnailUrl}
          alt={`Episode ${episode.number} artwork`}
          fill
          className="object-cover opacity-90 transition duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a14] via-[#050a14]/20 to-transparent" />
        <span className="absolute left-3 top-3 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          Episode {episode.number}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-bold leading-snug tracking-tight text-white group-hover:text-cyan-100">
          {episode.title}
        </h3>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-zinc-400">
          {episode.summary}
        </p>
        <div className="flex flex-wrap gap-2">
          {(episode.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-100/90"
            >
              {tag}
            </span>
          ))}
          <span className="ml-auto text-xs font-medium text-zinc-500">{episode.runtime}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.78rem] font-medium">
          {platformLinks
            .filter((platform) => {
              const url = episode[platform.key];
              return !!url?.trim();
            })
            .map((platform, index, arr) => (
            <span key={platform.id} className="inline-flex items-center">
              <Link
                href={episode[platform.key] ?? "#"}
                aria-label={`Open episode ${episode.number} on ${platform.label}`}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  "transition-colors duration-200 ease-out " + platform.className
                }
              >
                {platform.label}
              </Link>
              {index < arr.length - 1 ? (
                <span className="px-1 text-zinc-600" aria-hidden>
                  ·
                </span>
              ) : null}
            </span>
            ))}
        </div>
      </div>
    </article>
  );
}
