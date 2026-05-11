"use server";

import { evaluateAdminGate } from "@/lib/auth/admin-gate";
import { normalizeRichTextForStorage } from "@/lib/content/rich-text-storage";
import { getSessionUser } from "@/lib/auth/session";
import type { PodcastEpisodeRow } from "@/lib/database.types";
import { resolveUniquePodcastSlug, slugifyPodcast } from "@/lib/podcast/slug";
import { validateAdminImageUpload } from "@/lib/storage/validate-admin-image-upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BUCKET = "podcast-images";

type PodcastSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await getSessionUser();
  const gate = evaluateAdminGate(session);
  if (!gate.ok) return null;
  const supabase = await createSupabaseServerClient();
  return { supabase, userId: gate.session.user.id };
}

async function uploadThumbnail(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  formData: FormData,
): Promise<string | null> {
  const raw = formData.get("thumbnail_image");
  if (!raw || typeof raw === "string") return null;
  const file = raw as File;
  if (!file.size) return null;

  const checked = await validateAdminImageUpload(file);
  if (!checked.ok) {
    throw new Error(`thumbnail_image: ${checked.error}`);
  }

  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const path = `${userId}/${Date.now()}-podcast-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Thumbnail upload failed: ${error.message}`);
  return path;
}

async function removeStoragePaths(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  paths: (string | null | undefined)[],
) {
  const keys = paths.filter((p): p is string => !!p?.trim());
  if (!keys.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(keys);
  if (error) console.error("[podcast storage remove]", error.message);
}

function readPodcastForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const description = normalizeRichTextForStorage(String(formData.get("description") ?? ""));
  const runtime = String(formData.get("runtime") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "draft").trim();
  const youtube_url = String(formData.get("youtube_url") ?? "").trim() || null;
  const spotify_url = String(formData.get("spotify_url") ?? "").trim() || null;
  const apple_music_url =
    String(formData.get("apple_music_url") ?? "").trim() || null;
  const episodeNumberRaw = String(formData.get("episode_number") ?? "").trim();
  const episode_number = episodeNumberRaw ? Number(episodeNumberRaw) : null;

  return {
    title,
    slugInput,
    description,
    runtime,
    status,
    youtube_url,
    spotify_url,
    apple_music_url,
    episode_number:
      episode_number !== null && Number.isFinite(episode_number)
        ? episode_number
        : null,
  };
}

export async function createPodcastEpisodeAction(
  formData: FormData,
): Promise<PodcastSaveResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "Unauthorized: admin only." };
  const { supabase, userId } = auth;

  try {
    const f = readPodcastForm(formData);
    if (!f.title) return { ok: false, error: "Title is required." };

    const thumbnail = await uploadThumbnail(supabase, userId, formData);
    const baseSlug = slugifyPodcast(f.slugInput || f.title);
    const slug = await resolveUniquePodcastSlug(supabase, baseSlug);

    const payload = {
      title: f.title,
      slug,
      description: f.description,
      episode_number: f.episode_number,
      runtime: f.runtime,
      thumbnail_image: thumbnail,
      youtube_url: f.youtube_url,
      spotify_url: f.spotify_url,
      apple_music_url: f.apple_music_url,
      status: f.status,
      author_id: userId,
      published_at:
        f.status === "published" ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("podcast_episodes")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Insert failed." };
    }

    revalidatePath("/podcast");
    revalidatePath("/admin/podcasts");
    revalidatePath("/admin");
    return { ok: true, id: data.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function updatePodcastEpisodeAction(
  episodeId: string,
  formData: FormData,
): Promise<PodcastSaveResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "Unauthorized: admin only." };
  const { supabase, userId } = auth;

  try {
    const { data: existing, error: existingError } = await supabase
      .from("podcast_episodes")
      .select("*")
      .eq("id", episodeId)
      .maybeSingle();
    if (existingError || !existing) {
      return { ok: false, error: existingError?.message ?? "Episode not found." };
    }

    const row = existing as PodcastEpisodeRow;
    const f = readPodcastForm(formData);
    if (!f.title) return { ok: false, error: "Title is required." };

    const uploadedThumb = await uploadThumbnail(supabase, userId, formData);
    const thumbnail_image = uploadedThumb ?? row.thumbnail_image;

    const baseSlug = slugifyPodcast(f.slugInput || f.title);
    const slug = await resolveUniquePodcastSlug(supabase, baseSlug, episodeId);

    const patch = {
      title: f.title,
      slug,
      description: f.description,
      episode_number: f.episode_number,
      runtime: f.runtime,
      thumbnail_image,
      youtube_url: f.youtube_url,
      spotify_url: f.spotify_url,
      apple_music_url: f.apple_music_url,
      status: f.status,
      published_at:
        f.status === "published"
          ? row.published_at ?? new Date().toISOString()
          : null,
    };

    const { error } = await supabase
      .from("podcast_episodes")
      .update(patch)
      .eq("id", episodeId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/podcast");
    revalidatePath("/admin/podcasts");
    revalidatePath("/admin");
    return { ok: true, id: episodeId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function deletePodcastEpisodeAction(
  episodeId: string,
): Promise<PodcastSaveResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "Unauthorized: admin only." };
  const { supabase } = auth;

  const { data: row, error: fetchError } = await supabase
    .from("podcast_episodes")
    .select("*")
    .eq("id", episodeId)
    .maybeSingle();
  if (fetchError || !row) {
    return { ok: false, error: fetchError?.message ?? "Episode not found." };
  }

  const podcastRow = row as PodcastEpisodeRow;
  await removeStoragePaths(supabase, [podcastRow.thumbnail_image]);

  const { error } = await supabase
    .from("podcast_episodes")
    .delete()
    .eq("id", episodeId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/podcast");
  revalidatePath("/admin/podcasts");
  revalidatePath("/admin");
  return { ok: true, id: episodeId };
}
