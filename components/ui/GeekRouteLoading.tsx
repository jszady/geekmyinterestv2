const MESSAGES = [
  "Chill bruh, give us a sec...",
  "Loading the hot takes...",
  "Summoning the nerd takes...",
  "Buffering the chaos...",
] as const;

/**
 * Branded route transition UI (App Router `loading.tsx` segments).
 * Server-safe: picks a random line per request.
 */
export function GeekRouteLoading() {
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex min-h-[min(280px,42vh)] w-full flex-col items-center justify-center gap-5 px-6 py-16"
    >
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-violet-500/25 shadow-[0_0_28px_-4px_rgba(139,92,246,0.55),0_0_20px_-6px_rgba(34,211,238,0.35)]"
        aria-hidden
      >
        <span className="absolute inset-1 rounded-full border-2 border-transparent border-t-cyan-400/90 border-r-violet-400/50 animate-spin" />
        <span className="h-2 w-2 rounded-full bg-cyan-300/90 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
      </div>
      <p className="max-w-sm text-center text-sm font-medium leading-relaxed text-zinc-300">
        <span className="bg-gradient-to-r from-cyan-200/95 via-violet-200/90 to-fuchsia-200/85 bg-clip-text text-transparent">
          {message}
        </span>
      </p>
      <div className="flex gap-1.5" aria-hidden>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400/70 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400/70 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400/60 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
