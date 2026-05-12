"use client";

import {
  createPostV2Action,
  updatePostV2Action,
  type PostSaveResult,
} from "@/app/admin/post-actions";
import { AdminPostTagPicker } from "@/components/admin/AdminPostTagPicker";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import type { PostRow, TagRow } from "@/lib/database.types";
import type { SpacerSize } from "@/lib/posts/content-blocks";
import { toYouTubeEmbedUrl } from "@/lib/posts/section-video";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

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
const blockShell =
  "rounded-xl border border-white/[0.06] bg-[#050a14]/50 p-4 sm:p-5 space-y-3";
const btnSecondary =
  "rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-cyan-400/35 hover:text-cyan-100";
const btnDanger =
  "rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 hover:border-red-400/50";

type ClientImageData = {
  storagePath: string | null;
  caption: string;
  clearImage?: boolean;
};

type ClientPosterData = {
  image: string | null;
  caption: string;
  alt: string;
  clearImage?: boolean;
};

export type ClientContentBlock =
  | { id: string; type: "text"; order: number; data: { html: string } }
  | { id: string; type: "image"; order: number; data: ClientImageData }
  | { id: string; type: "poster"; order: number; data: ClientPosterData }
  | { id: string; type: "youtube"; order: number; data: { url: string } }
  | { id: string; type: "divider"; order: number; data: Record<string, never> }
  | { id: string; type: "spacer"; order: number; data: { size: SpacerSize } };

function newId(): string {
  return globalThis.crypto.randomUUID();
}

function createTextBlock(): ClientContentBlock {
  return {
    id: newId(),
    type: "text",
    order: 0,
    data: { html: "<p>Write your article content here.</p>" },
  };
}

function createImageBlock(): ClientContentBlock {
  return {
    id: newId(),
    type: "image",
    order: 0,
    data: { storagePath: null, caption: "" },
  };
}

function createPosterBlock(): ClientContentBlock {
  return {
    id: newId(),
    type: "poster",
    order: 0,
    data: { image: null, caption: "", alt: "" },
  };
}

function createYoutubeBlock(): ClientContentBlock {
  return {
    id: newId(),
    type: "youtube",
    order: 0,
    data: { url: "" },
  };
}

function createDividerBlock(): ClientContentBlock {
  return { id: newId(), type: "divider", order: 0, data: {} };
}

function createSpacerBlock(): ClientContentBlock {
  return { id: newId(), type: "spacer", order: 0, data: { size: "md" } };
}

function normalizeClientBlock(x: unknown, order: number): ClientContentBlock | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : newId();
  const type = o.type;
  const data = o.data;
  if (typeof data !== "object" || data === null) return null;
  const d = data as Record<string, unknown>;

  switch (type) {
    case "text":
      return {
        id,
        type: "text",
        order,
        data: { html: typeof d.html === "string" ? d.html : "<p></p>" },
      };
    case "image":
      return {
        id,
        type: "image",
        order,
        data: {
          storagePath:
            typeof d.storagePath === "string" && d.storagePath.trim()
              ? d.storagePath.trim()
              : null,
          caption: typeof d.caption === "string" ? d.caption : "",
        },
      };
    case "poster":
      return {
        id,
        type: "poster",
        order,
        data: {
          image: typeof d.image === "string" && d.image.trim() ? d.image.trim() : null,
          caption: typeof d.caption === "string" ? d.caption : "",
          alt: typeof d.alt === "string" ? d.alt : "",
        },
      };
    case "youtube":
      return {
        id,
        type: "youtube",
        order,
        data: { url: typeof d.url === "string" ? d.url : "" },
      };
    case "divider":
      return { id, type: "divider", order, data: {} };
    case "spacer": {
      const size = d.size;
      const s: SpacerSize =
        size === "sm" || size === "md" || size === "lg" ? size : "md";
      return { id, type: "spacer", order, data: { size: s } };
    }
    default:
      return null;
  }
}

function blocksFromPost(post: PostRow): ClientContentBlock[] {
  const raw = post.content_blocks;
  if (!Array.isArray(raw) || raw.length === 0) return [createTextBlock()];
  const list: ClientContentBlock[] = [];
  for (let i = 0; i < raw.length; i++) {
    const b = normalizeClientBlock(raw[i], i);
    if (b) list.push(b);
  }
  return list.length ? list : [createTextBlock()];
}

function serializeBlocks(blocks: ClientContentBlock[]): string {
  return JSON.stringify(
    blocks.map((b, i) => {
      if (b.type === "image") {
        return {
          id: b.id,
          type: "image",
          order: i,
          data: {
            storagePath: b.data.storagePath,
            caption: b.data.caption,
            ...(b.data.clearImage ? { clearImage: true } : {}),
          },
        };
      }
      if (b.type === "poster") {
        return {
          id: b.id,
          type: "poster",
          order: i,
          data: {
            image: b.data.image,
            caption: b.data.caption,
            alt: b.data.alt,
            ...(b.data.clearImage ? { clearImage: true } : {}),
          },
        };
      }
      return { ...b, order: i };
    }),
  );
}

type Props =
  | { mode: "create" }
  | { mode: "edit"; post: PostRow; initialTags: TagRow[] };

export function AdminPostFormV2(props: Props) {
  const router = useRouter();
  const post = props.mode === "edit" ? props.post : null;
  const editPostId = props.mode === "edit" ? props.post.id : "";

  const [blocks, setBlocks] = useState<ClientContentBlock[]>(() =>
    props.mode === "edit" ? blocksFromPost(props.post) : [createTextBlock()],
  );
  const [clearCardImage, setClearCardImage] = useState(false);
  const [clearHeroImage, setClearHeroImage] = useState(false);
  const jsonRef = useRef<HTMLInputElement>(null);

  const [state, formAction, pending] = useActionState(
    async (_prev: PostSaveResult | null, formData: FormData) => {
      if (props.mode === "create") {
        return createPostV2Action(formData);
      }
      return updatePostV2Action(editPostId, formData);
    },
    null as PostSaveResult | null,
  );

  useEffect(() => {
    if (state?.ok === true && props.mode === "create") {
      router.push(`/admin/posts/${state.id}/edit`);
      router.refresh();
    }
    if (state?.ok === true && props.mode === "edit") {
      router.refresh();
    }
  }, [state, router, props.mode]);

  function updateBlock(id: string, next: ClientContentBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? next : b)));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= blocks.length) return;
    setBlocks((prev) => {
      const copy = [...prev];
      const t = copy[index]!;
      copy[index] = copy[j]!;
      copy[j] = t;
      return copy;
    });
  }

  function removeBlock(index: number) {
    if (!globalThis.confirm("Remove this block?")) return;
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function addBlock(factory: () => ClientContentBlock) {
    setBlocks((prev) => [...prev, factory()]);
  }

  return (
    <form
      action={formAction}
      className="space-y-8"
      aria-busy={pending}
      onSubmit={() => {
        if (jsonRef.current) jsonRef.current.value = serializeBlocks(blocks);
      }}
    >
      <input type="hidden" name="content_blocks_json" ref={jsonRef} defaultValue="" />

      {state?.ok === false ? (
        <div
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}
      {state?.ok === true && state.warnings?.length ? (
        <div
          className="rounded-lg border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          <p className="font-semibold text-amber-50">Saved, but some uploads were skipped:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-100/95">
            {state.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {props.mode === "edit" && post ? (
        <p className="text-xs text-zinc-500">
          V2 block editor. Card/hero images: leave empty to keep current files. New uploads replace
          stored paths in <code className="text-zinc-400">post-images</code>.
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="v2-title">
            Title
          </label>
          <input
            id="v2-title"
            name="title"
            required
            defaultValue={post?.title}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="v2-slug">
            Slug
          </label>
          <input
            id="v2-slug"
            name="slug"
            placeholder="auto from title if empty"
            defaultValue={post?.slug}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="v2-category">
            Category
          </label>
          <select
            id="v2-category"
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
          <label className={labelClass} htmlFor="v2-status">
            Status
          </label>
          <select
            id="v2-status"
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
          <label className={labelClass} htmlFor="v2-homepage_slot">
            Homepage slot
          </label>
          <select
            id="v2-homepage_slot"
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
          <label className={labelClass} htmlFor="v2-excerpt">
            Excerpt
          </label>
          <textarea
            id="v2-excerpt"
            name="excerpt"
            rows={3}
            defaultValue={post?.excerpt ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="md:col-span-2">
          <AdminPostTagPicker
            key={props.mode === "edit" ? editPostId : "new-v2"}
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
          Card and hero are independent. In-article images work well at 1200×900 (4:3).
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
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/[0.05] pb-2">
            <dt className="font-medium text-zinc-300">Poster block</dt>
            <dd className="font-mono text-[13px] tabular-nums text-cyan-200/85">~600 × 900 (2:3)</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <dt className="font-medium text-zinc-300">Block images</dt>
            <dd className="font-mono text-[13px] tabular-nums text-cyan-200/85">1200 × 900 px</dd>
          </div>
        </dl>
      </aside>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <input type="hidden" name="clear_card_image" value={clearCardImage ? "1" : "0"} />
          <label className={labelClass} htmlFor="v2-card-image">
            Card image
          </label>
          <input
            id="v2-card-image"
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
          <label className={labelClass} htmlFor="v2-hero-image">
            Hero image
          </label>
          <input
            id="v2-hero-image"
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

      <div className="space-y-4 border-t border-white/[0.08] pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-300">
              Content blocks
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Add and reorder blocks. Text uses the same rich editor as classic posts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnSecondary} onClick={() => addBlock(createTextBlock)}>
              + Text
            </button>
            <button type="button" className={btnSecondary} onClick={() => addBlock(createImageBlock)}>
              + Image
            </button>
            <button type="button" className={btnSecondary} onClick={() => addBlock(createPosterBlock)}>
              + Poster image
            </button>
            <button type="button" className={btnSecondary} onClick={() => addBlock(createYoutubeBlock)}>
              + YouTube
            </button>
            <button type="button" className={btnSecondary} onClick={() => addBlock(createDividerBlock)}>
              + Divider
            </button>
            <button type="button" className={btnSecondary} onClick={() => addBlock(createSpacerBlock)}>
              + Spacer
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {blocks.map((b, index) => (
            <div key={b.id} className={blockShell}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-cyan-200/80">
                  {b.type === "text"
                    ? "Text section"
                    : b.type === "image"
                      ? "Image"
                      : b.type === "poster"
                        ? "Poster image"
                        : b.type === "youtube"
                          ? "YouTube"
                          : b.type === "divider"
                            ? "Divider"
                            : "Spacer"}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={index === 0}
                    onClick={() => moveBlock(index, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={index === blocks.length - 1}
                    onClick={() => moveBlock(index, 1)}
                  >
                    Down
                  </button>
                  <button type="button" className={btnDanger} onClick={() => removeBlock(index)}>
                    Delete
                  </button>
                </div>
              </div>

              {b.type === "text" ? (
                <AdminRichTextEditor
                  id={`rt-${b.id}`}
                  defaultValue={b.data.html}
                  minHeightClass="min-h-[200px]"
                  onHtmlChange={(html) =>
                    updateBlock(b.id, { ...b, data: { html } })
                  }
                />
              ) : null}

              {b.type === "image" ? (
                <div className="space-y-3">
                  <input
                    name={`v2img_${b.id}`}
                    type="file"
                    accept="image/*"
                    onChange={() =>
                      updateBlock(b.id, {
                        ...b,
                        data: { ...b.data, clearImage: false },
                      })
                    }
                    className="block w-full min-w-0 text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/[0.06] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-100"
                  />
                  {b.data.storagePath ? (
                    <p className="break-all text-[11px] text-zinc-500">
                      Stored: {b.data.storagePath}
                      {b.data.clearImage ? (
                        <span className="ml-2 text-amber-300/90">(will clear on save)</span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">Upload an image for this block.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {b.data.storagePath ? (
                      <button
                        type="button"
                        className={btnSecondary}
                        onClick={() =>
                          updateBlock(b.id, {
                            ...b,
                            data: {
                              ...b.data,
                              clearImage: !b.data.clearImage,
                            },
                          })
                        }
                      >
                        {b.data.clearImage ? "Undo clear image" : "Clear image"}
                      </button>
                    ) : null}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`cap-${b.id}`}>
                      Caption (optional)
                    </label>
                    <input
                      id={`cap-${b.id}`}
                      type="text"
                      value={b.data.caption}
                      onChange={(e) =>
                        updateBlock(b.id, {
                          ...b,
                          data: { ...b.data, caption: e.target.value },
                        })
                      }
                      className={fieldClass}
                      placeholder="Image caption"
                    />
                  </div>
                </div>
              ) : null}

              {b.type === "poster" ? (
                <div className="space-y-3">
                  <input
                    name={`v2img_${b.id}`}
                    type="file"
                    accept="image/*"
                    onChange={() =>
                      updateBlock(b.id, {
                        ...b,
                        data: { ...b.data, clearImage: false },
                      })
                    }
                    className="block w-full min-w-0 text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/[0.06] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-100"
                  />
                  {b.data.image ? (
                    <p className="break-all text-[11px] text-zinc-500">
                      Stored: {b.data.image}
                      {b.data.clearImage ? (
                        <span className="ml-2 text-amber-300/90">(will clear on save)</span>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500">Upload a poster image (shown cropped in article; full size in lightbox).</p>
                  )}
                  {b.data.image ? (
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() =>
                        updateBlock(b.id, {
                          ...b,
                          data: {
                            ...b.data,
                            clearImage: !b.data.clearImage,
                          },
                        })
                      }
                    >
                      {b.data.clearImage ? "Undo clear poster" : "Clear poster image"}
                    </button>
                  ) : null}
                  <div>
                    <label className={labelClass} htmlFor={`poster-cap-${b.id}`}>
                      Caption (optional)
                    </label>
                    <input
                      id={`poster-cap-${b.id}`}
                      type="text"
                      value={b.data.caption}
                      onChange={(e) =>
                        updateBlock(b.id, {
                          ...b,
                          data: { ...b.data, caption: e.target.value },
                        })
                      }
                      className={fieldClass}
                      placeholder="Shown under the poster"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`poster-alt-${b.id}`}>
                      Alt text (optional)
                    </label>
                    <input
                      id={`poster-alt-${b.id}`}
                      type="text"
                      value={b.data.alt}
                      onChange={(e) =>
                        updateBlock(b.id, {
                          ...b,
                          data: { ...b.data, alt: e.target.value },
                        })
                      }
                      className={fieldClass}
                      placeholder="Describe the poster for screen readers"
                    />
                  </div>
                </div>
              ) : null}

              {b.type === "youtube" ? (
                <div className="space-y-3">
                  <div>
                    <label className={labelClass} htmlFor={`yt-${b.id}`}>
                      YouTube URL
                    </label>
                    <input
                      id={`yt-${b.id}`}
                      type="url"
                      inputMode="url"
                      value={b.data.url}
                      onChange={(e) =>
                        updateBlock(b.id, { ...b, data: { url: e.target.value } })
                      }
                      className={fieldClass}
                      placeholder="https://www.youtube.com/watch?v=…"
                      autoComplete="off"
                    />
                  </div>
                  {(() => {
                    const src = toYouTubeEmbedUrl(b.data.url);
                    if (!src) return null;
                    return (
                      <div
                        className="relative w-full max-w-xl overflow-hidden rounded-lg border border-white/[0.08] bg-black"
                        style={{ aspectRatio: "16 / 9" }}
                      >
                        <iframe
                          title="YouTube preview"
                          className="absolute inset-0 h-full w-full border-0"
                          src={src}
                          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    );
                  })()}
                </div>
              ) : null}

              {b.type === "spacer" ? (
                <div>
                  <label className={labelClass} htmlFor={`sp-${b.id}`}>
                    Spacing
                  </label>
                  <select
                    id={`sp-${b.id}`}
                    value={b.data.size}
                    onChange={(e) =>
                      updateBlock(b.id, {
                        ...b,
                        data: { size: e.target.value as SpacerSize },
                      })
                    }
                    className={fieldClass}
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              ) : null}

              {b.type === "divider" ? (
                <p className="text-xs text-zinc-500">A horizontal rule on the published article.</p>
              ) : null}
            </div>
          ))}
        </div>
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
              ? "Create V2 post"
              : "Save changes"}
        </button>
        {props.mode === "edit" && state?.ok ? (
          <span className="self-center text-sm text-emerald-300/90">Saved.</span>
        ) : null}
      </div>
    </form>
  );
}
