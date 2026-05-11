"use client";

import {
  createPodcastEpisodeAction,
  updatePodcastEpisodeAction,
} from "@/app/admin/podcast-actions";
import { AdminRichTextEditor } from "@/components/admin/AdminRichTextEditor";
import type { PodcastEpisodeRow } from "@/lib/database.types";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

const fieldClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/30 focus:border-cyan-400/40 focus:ring-2";
const labelClass =
  "block text-xs font-semibold uppercase tracking-wide text-zinc-400";

type Props =
  | { mode: "create" }
  | { mode: "edit"; episode: PodcastEpisodeRow };

type SaveResult = { ok: true; id: string } | { ok: false; error: string } | null;

export function AdminPodcastForm(props: Props) {
  const router = useRouter();
  const episode = props.mode === "edit" ? props.episode : null;
  const editId = props.mode === "edit" ? props.episode.id : "";

  const [state, formAction, pending] = useActionState(
    async (_prev: SaveResult, formData: FormData) => {
      if (props.mode === "create") return createPodcastEpisodeAction(formData);
      return updatePodcastEpisodeAction(editId, formData);
    },
    null as SaveResult,
  );

  useEffect(() => {
    if (state?.ok === true && props.mode === "create") {
      router.push(`/admin/podcasts/${state.id}/edit?created=1`);
      router.refresh();
    }
    if (state?.ok === true && props.mode === "edit") {
      router.refresh();
    }
  }, [props.mode, router, state]);

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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={episode?.title}
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
            defaultValue={episode?.slug}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="episode_number">
            Episode number
          </label>
          <input
            id="episode_number"
            name="episode_number"
            type="number"
            min={0}
            defaultValue={episode?.episode_number ?? ""}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="runtime">
            Runtime
          </label>
          <input
            id="runtime"
            name="runtime"
            placeholder="e.g. 58 min"
            defaultValue={episode?.runtime ?? ""}
            className={fieldClass}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={episode?.status ?? "draft"}
            className={fieldClass}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="description">
            Description
          </label>
          <AdminRichTextEditor
            id="description"
            name="description"
            defaultValue={episode?.description ?? ""}
            placeholder="Episode description..."
            minHeightClass="min-h-[180px]"
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="thumbnail_image">
            Thumbnail image
          </label>
          <input
            id="thumbnail_image"
            name="thumbnail_image"
            type="file"
            accept="image/*"
            className="mt-2 block w-full text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-white/10 file:bg-white/[0.06] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-zinc-100"
          />
          {episode?.thumbnail_image ? (
            <p className="mt-1 break-all text-[11px] text-zinc-500">
              Current: {episode.thumbnail_image}
            </p>
          ) : null}
        </div>

        <div>
          <label className={labelClass} htmlFor="youtube_url">
            YouTube URL
          </label>
          <input
            id="youtube_url"
            name="youtube_url"
            type="url"
            defaultValue={episode?.youtube_url ?? ""}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="spotify_url">
            Spotify URL
          </label>
          <input
            id="spotify_url"
            name="spotify_url"
            type="url"
            defaultValue={episode?.spotify_url ?? ""}
            className={fieldClass}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor="apple_music_url">
            Apple Music URL
          </label>
          <input
            id="apple_music_url"
            name="apple_music_url"
            type="url"
            defaultValue={episode?.apple_music_url ?? ""}
            className={fieldClass}
          />
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
              ? "Create episode"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
