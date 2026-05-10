"use client";

import { ensureTagByNameAction, searchTagsAction } from "@/app/admin/tag-actions";
import type { TagRow } from "@/lib/database.types";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = { initialTags: TagRow[] };

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

  function addTag(tag: TagRow) {
    setSelected((prev) => (prev.some((p) => p.id === tag.id) ? prev : [...prev, tag]));
    setQuery("");
    setSuggestions([]);
    setHint(null);
    inputRef.current?.focus();
  }

  function removeTag(id: string) {
    setSelected((prev) => prev.filter((t) => t.id !== id));
  }

  async function commitNewTag() {
    const name = query.trim();
    if (!name) return;
    setBusy(true);
    setHint(null);
    const res = await ensureTagByNameAction(name);
    setBusy(false);
    if (!res.ok) {
      setHint(res.error);
      return;
    }
    addTag(res.tag);
    setOpen(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const raw = query.trim();
      if (!raw) return;
      const qLower = raw.toLowerCase();
      const exact = suggestions.find((s) => s.name.trim().toLowerCase() === qLower);
      if (exact) {
        addTag(exact);
        setOpen(false);
        return;
      }
      if (suggestions.length >= 1) {
        addTag(suggestions[0]!);
        setOpen(false);
        return;
      }
      void commitNewTag();
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

  return (
    <div ref={wrapRef} className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Tags
      </label>
      <p className="text-[11px] text-zinc-500">
        Type to search existing tags. Press{" "}
        <kbd className="rounded border border-white/15 bg-white/[0.06] px-1 py-0.5 font-mono text-[10px] text-zinc-300">
          Enter
        </kbd>{" "}
        to pick the first match or create a new tag. Reusable across posts — duplicates merge by slug.
      </p>

      <div
        className={
          "relative rounded-xl border border-white/10 bg-[#050a14] px-3 py-2 shadow-inner shadow-black/20 transition " +
          (open ? "border-cyan-400/40 shadow-[0_0_0_2px_rgba(34,211,238,0.12)]" : "")
        }
      >
        <div className="flex min-h-[42px] flex-wrap items-center gap-2">
          {selected.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 pl-2.5 pr-1 py-0.5 text-xs font-semibold text-cyan-100"
            >
              {t.name}
              <button
                type="button"
                onClick={() => removeTag(t.id)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
                aria-label={`Remove ${t.name}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setHint(null);
              const v = e.target.value;
              setQuery(v);
              if (!v.trim()) setSuggestions([]);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onInputKeyDown}
            placeholder={selected.length ? "Add another…" : "e.g. Marvel, Demon Slayer…"}
            className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            autoComplete="off"
            disabled={busy}
          />
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
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-white/[0.06] hover:text-white"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    addTag(t);
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
                No match — <span className="text-cyan-300/90">Enter</span> creates{" "}
                <span className="font-semibold text-zinc-300">&ldquo;{query.trim()}&rdquo;</span>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {selected.map((t) => (
        <input type="hidden" name="tag_id" value={t.id} key={t.id} />
      ))}

      {hint ? <p className="text-xs text-red-300/90">{hint}</p> : null}
      {busy ? <p className="text-xs text-zinc-500">Saving tag…</p> : null}
    </div>
  );
}
