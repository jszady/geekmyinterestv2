"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  imageUrl: string;
  alt: string;
  caption?: string;
};

/**
 * Article poster: fixed-aspect preview in a card; click opens full image in a lightbox (object-contain).
 */
export function PosterBlockInteractive({ imageUrl, alt, caption }: Props) {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const altText = alt.trim() || "Poster";

  return (
    <figure
      className="mt-8 w-full max-w-xl space-y-3"
      data-block-type="poster"
    >
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-950/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group block w-full text-left outline-none ring-cyan-400/0 transition hover:ring-2 focus-visible:ring-cyan-400/40"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={titleId}
        >
          <div className="relative mx-auto aspect-[2/3] w-full max-h-[min(70vh,520px)] max-w-sm bg-zinc-900">
            <Image
              src={imageUrl}
              alt={altText}
              fill
              className="object-cover object-center transition duration-300 group-hover:opacity-95"
              sizes="(max-width: 768px) 100vw, 384px"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 py-8 pt-16 text-center text-xs font-semibold uppercase tracking-wide text-white/95">
              Tap to enlarge
            </span>
          </div>
        </button>
        <div className="border-t border-white/[0.06] px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-sm font-semibold text-cyan-300 underline decoration-cyan-400/40 underline-offset-2 transition hover:text-cyan-200 hover:decoration-cyan-300/70"
          >
            View full poster
          </button>
        </div>
      </div>
      {caption ? (
        <figcaption id={titleId} className="text-center text-sm text-zinc-500">
          {caption}
        </figcaption>
      ) : (
        <span id={titleId} className="sr-only">
          {altText}
        </span>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-3 sm:p-6"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Full poster"
            className="relative flex max-h-[min(92dvh,920px)] max-w-[min(96vw,1200px)] flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeBtnRef}
              type="button"
              onClick={close}
              className="absolute -right-1 -top-12 z-[1] flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/20 bg-zinc-900/95 text-2xl leading-none text-zinc-100 shadow-lg transition hover:border-cyan-400/40 hover:text-white sm:right-0 sm:top-0 sm:translate-x-1 sm:translate-y-[-100%]"
              aria-label="Close"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- lightbox needs native img for reliable object-contain + any aspect */}
            <img
              src={imageUrl}
              alt={altText}
              className="max-h-[min(88dvh,880px)] max-w-full object-contain object-center"
              decoding="async"
            />
          </div>
        </div>
      ) : null}
    </figure>
  );
}
