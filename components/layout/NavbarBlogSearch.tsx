"use client";

import type { PostCardData } from "@/components/feed/types";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 360;
const DROPDOWN_LIMIT = 8;

type ApiOk = { ok: true; results: PostCardData[] };
type ApiErr = { ok: false; error?: string };

function previewText(post: PostCardData, max: number): string {
  const ex = post.excerpt?.trim();
  if (ex) return ex.length <= max ? ex : `${ex.slice(0, max)}…`;
  return post.title.length <= max ? post.title : `${post.title.slice(0, max)}…`;
}

export type NavbarBlogSearchProps = {
  /** Wide field — homepage desktop, right of centered logo. */
  variant: "inline" | "popover";
};

export function NavbarBlogSearch({ variant }: NavbarBlogSearchProps) {
  const router = useRouter();
  const isPopover = variant === "popover";
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const uiOpen = isPopover ? panelOpen : open;
  const setUiOpen = isPopover ? setPanelOpen : setOpen;

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [value]);

  const runFetch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&limit=${DROPDOWN_LIMIT}`,
        { signal: ac.signal },
      );
      const json = (await res.json()) as ApiOk | ApiErr;
      if (!res.ok || !json.ok) {
        setResults([]);
        return;
      }
      setResults(json.results);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    void runFetch(debounced);
  }, [debounced, runFetch]);

  useLayoutEffect(() => {
    if (!isPopover || !panelOpen || !triggerRef.current) return;
    const el = triggerRef.current;
    const place = () => {
      const r = el.getBoundingClientRect();
      const w = Math.min(360, window.innerWidth - 24);
      const left = Math.max(12, Math.min(r.right - w, window.innerWidth - w - 12));
      setPopoverStyle({ top: r.bottom + 8, left, width: w });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isPopover, panelOpen, results.length]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPanelOpen(false);
        setPopoverStyle(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!isPopover || !panelOpen) return;
    const t = window.setTimeout(() => {
      wrapRef.current?.querySelector<HTMLInputElement>("input[type='search']")?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isPopover, panelOpen]);

  useEffect(() => {
    if (!panelOpen && !open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setPanelOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, open]);

  const showPanel = uiOpen && debounced.length >= 2;
  const empty = showPanel && !loading && results.length === 0;
  const qForSearch = encodeURIComponent(debounced);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPanel || results.length === 0) {
      if (e.key === "Escape") setUiOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setUiOpen(false);
      setActiveIdx(-1);
    } else if (e.key === "Enter" && activeIdx >= 0) {
      const href = results[activeIdx]?.href;
      if (href) {
        setOpen(false);
        setPanelOpen(false);
        router.push(href);
      }
    }
  }

  useEffect(() => {
    setActiveIdx(-1);
  }, [results]);

  const inputClass =
    "w-full rounded-lg border border-white/[0.1] bg-[#050a14]/95 py-2.5 pl-11 pr-10 text-xs text-zinc-100 shadow-inner shadow-black/30 outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/45 focus:shadow-[0_0_0_2px_rgba(34,211,238,0.12)] sm:text-sm";

  function renderDropdownBody() {
    return (
      <>
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-zinc-500">
            <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-400/40" />
            Searching…
          </div>
        ) : null}
        {!loading && empty ? (
          <p className="px-3 py-3 text-sm text-zinc-500">No results found.</p>
        ) : null}
        {!loading && results.length > 0 ? (
          <ul className="divide-y divide-white/[0.06] py-0.5">
            {results.map((post, i) => {
              const active = i === activeIdx;
              return (
                <li key={post.href}>
                  <Link
                    href={post.href}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => {
                      setOpen(false);
                      setPanelOpen(false);
                    }}
                    className={
                      "flex gap-2.5 px-2.5 py-2 transition sm:gap-3 sm:px-3 sm:py-2.5 " +
                      (active
                        ? "bg-gradient-to-r from-cyan-500/[0.12] to-violet-500/[0.08]"
                        : "hover:bg-white/[0.04]")
                    }
                  >
                    <div className="relative mt-0.5 h-11 w-16 shrink-0 overflow-hidden rounded-md border border-white/[0.08] bg-zinc-900 sm:h-12 sm:w-[4.5rem]">
                      <Image
                        src={post.image.src}
                        alt=""
                        fill
                        className="object-cover object-[center_22%]"
                        sizes="72px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-300/85">
                        {post.category}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-white sm:text-sm">
                        {post.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">{previewText(post, 100)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
        {debounced.length >= 2 ? (
          <div className="border-t border-white/[0.06] px-2 py-1.5 sm:px-3">
            <Link
              href={`/search?q=${qForSearch}`}
              className="block rounded-md px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200/90 transition hover:bg-white/[0.05] hover:text-cyan-100 sm:text-xs"
              onClick={() => {
                setOpen(false);
                setPanelOpen(false);
              }}
            >
              View all results
            </Link>
          </div>
        ) : null}
      </>
    );
  }

  const togglePopover = useCallback(() => {
    if (panelOpen) {
      setPopoverStyle(null);
      setPanelOpen(false);
      return;
    }
    const el = triggerRef.current;
    if (el && typeof window !== "undefined") {
      const r = el.getBoundingClientRect();
      const w = Math.min(360, window.innerWidth - 24);
      const left = Math.max(12, Math.min(r.right - w, window.innerWidth - w - 12));
      setPopoverStyle({ top: r.bottom + 8, left, width: w });
    }
    setPanelOpen(true);
  }, [panelOpen]);

  if (isPopover) {
    return (
      <div ref={wrapRef} className="relative flex shrink-0 items-center">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={panelOpen}
          aria-haspopup="dialog"
          aria-label="Search articles"
          onClick={togglePopover}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.02] text-zinc-400 transition hover:border-cyan-400/35 hover:text-cyan-100"
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
        {panelOpen && popoverStyle ? (
          <div
            className="fixed z-[100] flex max-h-[min(78vh,32rem)] flex-col rounded-xl border border-white/[0.1] bg-[#070d18]/98 p-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9)] backdrop-blur-sm"
            style={{
              top: popoverStyle.top,
              left: popoverStyle.left,
              width: popoverStyle.width,
            }}
          >
            <div className="relative shrink-0">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Search className="h-5 w-5" strokeWidth={2} />
              </span>
              <input
                type="search"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search articles..."
                autoComplete="off"
                className={inputClass}
              />
              {value ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
                  aria-label="Clear search"
                  onClick={() => {
                    setValue("");
                    setResults([]);
                    setDebounced("");
                  }}
                >
                  ×
                </button>
              ) : null}
            </div>
            <div className="mt-1 min-h-0 flex-1 overflow-y-auto rounded-lg border border-white/[0.06] bg-[#050a14]/50">
              {showPanel ? (
                renderDropdownBody()
              ) : value.trim().length > 0 && value.trim().length < 2 ? (
                <p className="px-3 py-2 text-xs text-zinc-500">Type at least 2 characters…</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="relative isolate w-full min-w-0 max-w-[min(18rem,34vw)]"
    >
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 sm:left-3">
          <Search className="h-5 w-5" strokeWidth={2} />
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search articles..."
          autoComplete="off"
          className={inputClass}
        />
        {value ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-sm text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              setResults([]);
              setDebounced("");
              setOpen(false);
            }}
          >
            ×
          </button>
        ) : null}
      </div>
      {showPanel ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-[120] w-full max-w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-white/[0.1] bg-[#070d18]/98 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.88)] backdrop-blur-sm transition-opacity duration-150 ease-out"
          role="region"
          aria-live="polite"
        >
          <div className="max-h-[min(65vh,22rem)] overflow-y-auto overscroll-contain">
            {renderDropdownBody()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
