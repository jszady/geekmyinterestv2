"use client";

import {
  createPostAction,
  updatePostAction,
  type PostSaveResult,
} from "@/app/admin/post-actions";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import { AdminPostTagPicker } from "@/components/admin/AdminPostTagPicker";
import type { PostRow, TagRow } from "@/lib/database.types";
import {
  postSectionIndices,
  sectionTopImageFormName,
  sectionTopVideoFormName,
  sectionTextFormName,
  sectionImageFormName,
  sectionVideoFormName,
} from "@/lib/posts/section-fields";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";

const CATEGORIES = ["Movie", "Anime", "Show", "Game", "Tech"] as const;
const STATUSES = ["draft", "published"] as const;
const SLOTS = [
  { value: "", label: "None" },
  { value: "main_feature", label: "main_feature" },
  { value: "feature_1", label: "feature_1" },
  { value: "feature_2", label: "feature_2" },
  { value: "feature_3", label: "feature_3" },
  { value: "feature_4", label: "feature_4" },
  { value: "feature_5", label: "feature_5" },
  { value: "feature_6", label: "feature_6" },
] as const;

const fieldClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/30 focus:border-cyan-400/40 focus:ring-2";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-zinc-400";

type Props =
  | { mode: "create" }
  | { mode: "edit"; post: PostRow; initialTags: TagRow[] };

export function AdminPostForm(props: Props) {
  const router = useRouter();
  const post = props.mode === "edit" ? props.post : null;
  const editPostId = props.mode === "edit" ? props.post.id : "";

  const [state, formAction, pending] = useActionState(
    async (_prev: PostSaveResult | null, formData: FormData) => {
      if (props.mode === "create") {
        return createPostAction(formData);
      }
      return updatePostAction(editPostId, formData);
    },
    null as PostSaveResult | null,
  );

  useEffect(() => {
    if (state?.ok === true && props.mode === "create") {
      router.push(`/admin/posts/${state.id}/edit?created=1`);
      router.refresh();
    }
    if (state?.ok === true && props.mode === "edit") {
      router.refresh();
    }
  }, [state, router, props.mode]);

  const initialClears = useMemo<Record<string, boolean>>(() => ({}), []);
  const [clearFlags, setClearFlags] = useState<Record<string, boolean>>(initialClears);
  const [clearCardImage, setClearCardImage] = useState(false);
  const [clearHeroImage, setClearHeroImage] = useState(false);

  function toggleClear(fieldName: string) {
    setClearFlags((prev) => ({ ...prev, [fieldName]: !prev[fieldName] }));
  }

  return (
    <form
      action={formAction}
      className="space-y-8"
      aria-busy={pending}
    >
      {state?.ok === false ? (
        <div
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}
      {props.mode === "edit" && post ? (
        <p className="text-xs text-zinc-500">
          Leave image fields empty to keep existing files. New uploads replace the stored path in{" "}
          <code className="text-zinc-400">post-images</code>.
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={post?.title}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="slug">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            placeholder="auto from title if empty"
            defaultValue={post?.slug}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="category">
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={post?.category ?? "Movie"}
            className={fieldClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            required
            defaultValue={post?.status ?? "draft"}
            className={fieldClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="homepage_slot">
            Homepage slot
          </label>
          <select
            id="homepage_slot"
            name="homepage_slot"
            defaultValue={post?.homepage_slot ?? ""}
            className={fieldClass}
          >
            {SLOTS.map((s) => (
              <option key={s.value || "none"} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="excerpt">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            defaultValue={post?.excerpt ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="md:col-span-2">
          <AdminPostTagPicker
            key={props.mode === "edit" ? props.post.id : "new"}
            initialTags={props.mode === "edit" ? props.initialTags : []}
          />
        </div>
      </div>

      <aside
        className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#050a14]/90 to-[#070d18]/80 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-5"
        aria-label="Recommended image dimensions"
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-200/90">
          Recommended image sizes
        </h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
          Match these before upload so crops on the site look intentional — layouts use wide, cover-style
          framing.
        </p>
        <dl className="mt-4 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.05] pb-2">
            <dt className="font-medium text-zinc-300">Card image</dt>
            <dd className="font-mono text-[13px] tabular-nums text-cyan-200/85">1200 × 800 px</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.05] pb-2">
            <dt className="font-medium text-zinc-300">Hero image</dt>
            <dd className="font-mono text-[13px] tabular-nums text-cyan-200/85">1600 × 900 px</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="font-medium text-zinc-300">Section images</dt>
            <dd className="font-mono text-[13px] tabular-nums text-cyan-200/85">1200 × 900 px</dd>
          </div>
        </dl>
        <ul className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-3 text-[11px] leading-relaxed text-zinc-500">
          <li className="flex gap-2">
            <span className="text-cyan-500/80" aria-hidden>
              ·
            </span>
            <span>Keep key subjects near the center — edges may crop on smaller screens.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-500/80" aria-hidden>
              ·
            </span>
            <span>Avoid critical text or faces tight against the frame.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-500/80" aria-hidden>
              ·
            </span>
            <span>Use high-quality JPG or PNG; avoid tiny images that will look soft when scaled.</span>
          </li>
        </ul>
      </aside>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <input type="hidden" name="clear_card_image" value={clearCardImage ? "1" : "0"} />
          <label className={labelClass} htmlFor="post-card-image">
            Card image
          </label>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Used for homepage and article cards only — independent from the hero.
          </p>
          <input
            id="post-card-image"
            name="card_image"
            type="file"
            accept="image/*"
            className="mt-2 block w-full min-w-0 text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/[0.06] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-100"
          />
          {post?.card_image ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 break-all text-[11px] text-zinc-500">
                Current: {post.card_image}
              </p>
              <button
                type="button"
                onClick={() => setClearCardImage((c) => !c)}
                className="min-h-[36px] shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 hover:border-red-400/45 hover:text-red-200"
              >
                {clearCardImage ? "Undo clear card" : "Clear card image"}
              </button>
            </div>
          ) : null}
        </div>
        <div>
          <input type="hidden" name="clear_hero_image" value={clearHeroImage ? "1" : "0"} />
          <label className={labelClass} htmlFor="post-hero-image">
            Hero image
          </label>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Large image at the top of the article only — not used for listing cards.
          </p>
          <input
            id="post-hero-image"
            name="hero_image"
            type="file"
            accept="image/*"
            className="mt-2 block w-full min-w-0 text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/[0.06] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-100"
          />
          {post?.hero_image ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 break-all text-[11px] text-zinc-500">
                Current: {post.hero_image}
              </p>
              <button
                type="button"
                onClick={() => setClearHeroImage((c) => !c)}
                className="min-h-[36px] shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 hover:border-red-400/45 hover:text-red-200"
              >
                {clearHeroImage ? "Undo clear hero" : "Clear hero image"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-8 border-t border-white/[0.08] pt-8">
        <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
          Editorial sections (1–15)
        </h2>
        <p className="text-xs text-zinc-500">
          Each section can have text, an image, a video/trailer link, any combination, or be left empty. Use as
          many sections as you need for articles or ranked lists. Section images work best at{" "}
          <span className="font-mono text-zinc-400">1200 × 900 px</span> (see recommended sizes above). Paste a
          URL only — no file uploads for video yet. YouTube URLs embed on the article; TikTok, Instagram Reels,
          X posts, and other links show a “Watch clip” button.
        </p>
        {postSectionIndices().map((n) => {
          const tk = sectionTextFormName(n);
          const ikTop = sectionTopImageFormName(n);
          const vkTop = sectionTopVideoFormName(n);
          const ikBottom = sectionImageFormName(n);
          const vkBottom = sectionVideoFormName(n);
          const pr = post as Record<string, string | null | undefined> | null;
          const textDefault = pr?.[tk] ?? "";
          const topPathDefault = pr?.[ikTop] ?? null;
          const topVideoDefault = pr?.[vkTop] ?? "";
          const bottomPathDefault = pr?.[ikBottom] ?? null;
          const bottomVideoDefault = pr?.[vkBottom] ?? "";
          const clearTop = !!clearFlags[ikTop];
          const clearBottom = !!clearFlags[ikBottom];
          return (
            <div
              key={n}
              className="rounded-xl border border-white/[0.06] bg-[#050a14]/50 p-4 sm:p-5"
            >
              <h3 className="mb-3 text-sm font-semibold text-cyan-200/90">Section {n}</h3>
              <div className="space-y-4">
                <div>
                  <span className={labelClass}>Top image</span>
                  <input
                    type="hidden"
                    name={`clear_${ikTop}`}
                    value={clearTop ? "1" : "0"}
                  />
                  <input
                    name={ikTop}
                    type="file"
                    accept="image/*"
                    className="mt-2 block w-full text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/[0.06] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-100"
                  />
                  {topPathDefault ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="break-all text-[11px] text-zinc-500">
                        Current: {topPathDefault}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleClear(ikTop)}
                        className="rounded border border-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 hover:border-red-400/45 hover:text-red-200"
                      >
                        {clearTop ? "Undo clear" : "Clear image"}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div>
                  <label className={labelClass} htmlFor={vkTop}>
                    Top video / trailer URL (optional)
                  </label>
                  <input
                    id={vkTop}
                    name={vkTop}
                    type="text"
                    inputMode="url"
                    placeholder="https://www.youtube.com/watch?v=…"
                    defaultValue={topVideoDefault}
                    className={fieldClass}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={tk}>
                    Section {n} text
                  </label>
                  <AdminRichTextEditor
                    id={tk}
                    name={tk}
                    defaultValue={textDefault}
                    placeholder={`Write section ${n} content...`}
                    minHeightClass="min-h-[200px]"
                  />
                </div>
                <div>
                  <span className={labelClass}>Bottom image</span>
                  <input
                    type="hidden"
                    name={`clear_${ikBottom}`}
                    value={clearBottom ? "1" : "0"}
                  />
                  <input
                    name={ikBottom}
                    type="file"
                    accept="image/*"
                    className="mt-2 block w-full text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/[0.06] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-100"
                  />
                  {bottomPathDefault ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="break-all text-[11px] text-zinc-500">
                        Current: {bottomPathDefault}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleClear(ikBottom)}
                        className="rounded border border-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 hover:border-red-400/45 hover:text-red-200"
                      >
                        {clearBottom ? "Undo clear" : "Clear image"}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div>
                  <label className={labelClass} htmlFor={vkBottom}>
                    Bottom video / trailer URL (optional)
                  </label>
                  <input
                    id={vkBottom}
                    name={vkBottom}
                    type="text"
                    inputMode="url"
                    placeholder="https://www.youtube.com/watch?v=…"
                    defaultValue={bottomVideoDefault}
                    className={fieldClass}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-cyan-400/45 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_-6px_rgba(34,211,238,0.45)] disabled:opacity-60"
        >
          {pending
            ? "Saving..."
            : props.mode === "create"
              ? "Create post"
              : "Save changes"}
        </button>
        {props.mode === "edit" && state?.ok ? (
          <span className="self-center text-sm text-emerald-300/90">Saved.</span>
        ) : null}
      </div>
    </form>
  );
}
