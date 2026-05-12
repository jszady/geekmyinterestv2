"use client";

import { ensureTagByNameAction, searchTagsAction } from "@/app/admin/tag-actions";
import type { TagRow } from "@/lib/database.types";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = { initialTags: TagRow[] };

/** Trim, collapse spaces, lowercase (e.g. " Marvel  " → "marvel"). */
function normalizeTagToken(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

function isDuplicate(prev: TagRow[], tag: TagRow): boolean {
  return prev.some(
    (p) =>
      p.id === tag.id ||
      p.name.trim().toLowerCase() === tag.name.trim().toLowerCase(),
  );
}

export function AdminPostTagPicker({ initialTags }: Props) {
  const [selected, setSelected] = useState<TagRow[]>(() => initialTags);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TagRow[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const t = q.trim();
    if (t.length < 1) {
      setSuggestions([]);
      return;
    }
    const ids = new Set(selected.map((x) => x.id));
    const rows = await searchTagsAction(t);
    setSuggestions(rows.filter((r) => !ids.has(r.id)));
  }, [selected]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) return;
    const id = window.setTimeout(() => {
      void runSearch(q);
    }, 220);
    return () => window.clearTimeout(id);
  }, [query, runSearch]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pickTag(tag: TagRow) {
    setSelected((prev) => (isDuplicate(prev, tag) ? prev : [...prev, tag]));
    setQuery("");
    setSuggestions([]);
    setHint(null);
    inputRef.current?.focus();
  }

  function removeTag(id: string) {
    setSelected((prev) => prev.filter((t) => t.id !== id));
  }

  /**
   * Create or resolve tag by normalized name; append if not already selected.
   * When `clearInput` is false (comma-separated batch), do not clear the field — caller keeps the tail segment.
   */
  async function ensureAndAppend(
    rawToken: string,
    clearInput = true,
  ): Promise<boolean> {
    const name = normalizeTagToken(rawToken);
    if (!name) return false;

    setBusy(true);
    if (clearInput) setHint(null);
    const res = await ensureTagByNameAction(name);
    setBusy(false);
    if (!res.ok) {
      setHint(res.error);
      return false;
    }

    let added = false;
    setSelected((prev) => {
      if (isDuplicate(prev, res.tag)) return prev;
      added = true;
      return [...prev, res.tag];
    });
    if (!added) {
      if (clearInput) setHint("That tag is already added.");
      return false;
    }
    if (clearInput) {
      setQuery("");
      setSuggestions([]);
      setOpen(false);
      inputRef.current?.focus();
    }
    return true;
  }

  async function commitFromEnter() {
    const raw = query.trim();
    if (!raw) return;
    const qLower = normalizeTagToken(raw);
    const exact = suggestions.find((s) => s.name.trim().toLowerCase() === qLower);
    if (exact) {
      pickTag(exact);
      setOpen(false);
      return;
    }
    if (suggestions.length >= 1) {
      pickTag(suggestions[0]!);
      setOpen(false);
      return;
    }
    await ensureAndAppend(raw, true);
  }

  async function flushQuery() {
    const raw = query.trim();
    if (!raw) return;
    await ensureAndAppend(raw, true);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void commitFromEnter();
      return;
    }
    if (e.key === "Backspace" && query.length === 0 && selected.length) {
      e.preventDefault();
      removeTag(selected[selected.length - 1]!.id);
    }
    if (e.key === "Escape") {
      setOpen(false);
      setSuggestions([]);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHint(null);
    const value = e.target.value;
    if (!value.includes(",")) {
      setQuery(value);
      if (!value.trim()) setSuggestions([]);
      setOpen(true);
      return;
    }

    const parts = value.split(",");
    const tail = parts.pop() ?? "";
    const toCommit = parts.map((p) => normalizeTagToken(p)).filter(Boolean);

    void (async () => {
      for (const token of toCommit) {
        const ok = await ensureAndAppend(token, false);
        if (!ok) break;
      }
      setSuggestions([]);
    })();

    setQuery(tail);
    if (!tail.trim()) setSuggestions([]);
    setOpen(true);
  }

  function onInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    const next = e.relatedTarget;
    if (next instanceof Node && wrapRef.current?.contains(next)) return;
    window.setTimeout(() => {
      if (wrapRef.current?.contains(document.activeElement)) return;
      const q = inputRef.current?.value.trim() ?? "";
      if (q) void flushQuery();
    }, 120);
  }

  return (
    <div ref={wrapRef} className="min-w-0 space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Tags
      </label>
      <p className="text-[11px] leading-relaxed text-zinc-500">
        Add with{" "}
        <kbd className="rounded border border-white/15 bg-white/[0.06] px-1 py-0.5 font-mono text-[10px] text-zinc-300">
          Enter
        </kbd>
        , a comma, the Add button, or by leaving the field (Done / blur). Duplicates are skipped.
      </p>

      <div
        className={
          "relative min-w-0 rounded-xl border border-white/10 bg-[#050a14] px-3 py-2 shadow-inner shadow-black/20 transition " +
          (open ? "border-cyan-400/40 shadow-[0_0_0_2px_rgba(34,211,238,0.12)]" : "")
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <div className="flex min-h-[44px] min-w-0 flex-1 flex-wrap items-center gap-2">
            {selected.map((t) => (
              <span
                key={t.id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 py-0.5 pl-2.5 pr-1 text-xs font-semibold text-cyan-100"
              >
                <span className="min-w-0 truncate">{t.name}</span>
                <button
                  type="button"
                  onClick={() => removeTag(t.id)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white sm:h-8 sm:w-8"
                  aria-label={`Remove ${t.name}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              enterKeyHint="done"
              value={query}
              onChange={onInputChange}
              onFocus={() => setOpen(true)}
              onBlur={onInputBlur}
              onKeyDown={onInputKeyDown}
              placeholder={selected.length ? "Add another…" : "e.g. Marvel, anime…"}
              className="min-h-[44px] min-w-[6rem] flex-1 border-0 bg-transparent py-2 text-base text-zinc-100 outline-none placeholder:text-zinc-600 sm:min-h-0 sm:py-1 sm:text-sm"
              autoComplete="off"
              disabled={busy}
            />
          </div>
          <button
            type="button"
            disabled={busy || !query.trim()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void flushQuery()}
            className="min-h-[44px] shrink-0 rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-4 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/55 hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Add
          </button>
        </div>

        {open && (suggestions.length > 0 || (query.trim().length > 0 && !suggestions.length)) ? (
          <ul
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-52 overflow-auto rounded-xl border border-white/[0.1] bg-[#070d18] py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.85)]"
            role="listbox"
          >
            {suggestions.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="flex min-h-[44px] w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    pickTag(t);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="font-mono text-[10px] text-zinc-500">{t.slug}</span>
                </button>
              </li>
            ))}
            {query.trim().length > 0 && !suggestions.length && !busy ? (
              <li className="px-3 py-2 text-xs text-zinc-500">
                No match — tap{" "}
                <span className="font-semibold text-cyan-300/90">Add</span> or{" "}
                <span className="font-semibold text-cyan-300/90">Enter</span> to create{" "}
                <span className="font-semibold text-zinc-300">
                  &ldquo;{normalizeTagToken(query)}&rdquo;
                </span>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {selected.map((t) => (
        <input type="hidden" name="tag_id" value={t.id} key={t.id} />
      ))}

      {hint ? <p className="text-xs text-red-300/90">{hint}</p> : null}
      {busy ? <p className="text-xs text-zinc-500">Working…</p> : null}
    </div>
  );
}
