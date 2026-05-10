import { OFFICIAL_LINKS } from "@/lib/social/official-links";

const iconWrap =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:border-cyan-400/35 hover:bg-white/[0.1] hover:shadow-[0_0_20px_-4px_rgba(34,211,238,0.4)]";

export function SocialIcons() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="text-sm font-medium text-zinc-500">Follow Us</p>
      <ul className="flex flex-wrap items-center gap-3" aria-label="Social links">
        <li>
          <a
            href={OFFICIAL_LINKS.x}
            target="_blank"
            rel="noopener noreferrer"
            className={iconWrap}
            aria-label="X"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M18.9 2H22l-6.77 7.74L23.2 22H16.9l-4.93-6.82L5.96 22H2.84l7.25-8.3L.8 2h6.45l4.45 6.18L18.9 2Zm-1.1 18h1.73L6.32 3.9H4.47L17.8 20Z" />
            </svg>
          </a>
        </li>
        <li>
          <a
            href={OFFICIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={iconWrap}
            aria-label="Instagram"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.75A4 4 0 0 0 3.75 7.75v8.5a4 4 0 0 0 4 4h8.5a4 4 0 0 0 4-4v-8.5a4 4 0 0 0-4-4h-8.5Zm8.87 1.5a1.13 1.13 0 1 1 0 2.26 1.13 1.13 0 0 1 0-2.26ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z" />
            </svg>
          </a>
        </li>
        <li>
          <a
            href={OFFICIAL_LINKS.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className={iconWrap}
            aria-label="YouTube"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136c.502-1.884.502-5.814.502-5.814s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        </li>
        <li>
          <a
            href={OFFICIAL_LINKS.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className={iconWrap}
            aria-label="Spotify"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 1.75a10.25 10.25 0 1 0 0 20.5 10.25 10.25 0 0 0 0-20.5Zm4.6 14.77a.8.8 0 0 1-1.1.26 6.64 6.64 0 0 0-7 0 .8.8 0 0 1-1.09-.27.8.8 0 0 1 .27-1.09 8.24 8.24 0 0 1 8.64 0 .8.8 0 0 1 .28 1.1Zm1.57-2.56a1 1 0 0 1-1.38.32 9.8 9.8 0 0 0-9.6 0 1 1 0 1 1-.95-1.76 11.8 11.8 0 0 1 11.5 0 1 1 0 0 1 .43 1.44Zm.14-2.64A12.5 12.5 0 0 0 6 11.31a1.2 1.2 0 0 1-1.14-2.1 14.9 14.9 0 0 1 14.28 0 1.2 1.2 0 0 1-1.14 2.1Z" />
            </svg>
          </a>
        </li>
        <li>
          <a
            href={OFFICIAL_LINKS.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className={iconWrap}
            aria-label="TikTok"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M14.6 3c.18 1.68 1.4 3.04 3.07 3.33v2.34a5.36 5.36 0 0 1-3.01-1v6.12a5.79 5.79 0 1 1-5.03-5.75v2.42a3.35 3.35 0 1 0 2.6 3.26V3h2.37Z" />
            </svg>
          </a>
        </li>
      </ul>
    </div>
  );
}
