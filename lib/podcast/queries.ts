import type { PodcastEpisodeRow } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function fetchPublishedPodcastEpisodes(): Promise<PodcastEpisodeRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("podcast_episodes")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[podcast] published list", error.message);
    return [];
  }

  return (data ?? []) as PodcastEpisodeRow[];
}

export async function fetchPublishedPodcastEpisodesCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("podcast_episodes")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  if (error) {
    console.error("[podcast] published count", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Newest published episode (featured slot). */
export async function fetchLatestPublishedPodcastEpisode(): Promise<PodcastEpisodeRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("podcast_episodes")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[podcast] latest episode", error.message);
    return null;
  }
  return (data ?? null) as PodcastEpisodeRow | null;
}

/**
 * Paginated grid rows after the featured episode (index 0 in date order).
 * `gridPage` is 1-based. Uses inclusive Supabase `.range`.
 */
export async function fetchPublishedPodcastEpisodesGridPage(
  gridPage: number,
  pageSize: number,
): Promise<PodcastEpisodeRow[]> {
  const start = 1 + (gridPage - 1) * pageSize;
  const end = start + pageSize - 1;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("podcast_episodes")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    console.error("[podcast] grid page", error.message);
    return [];
  }
  return (data ?? []) as PodcastEpisodeRow[];
}

export async function fetchAllPodcastEpisodesForAdmin(): Promise<PodcastEpisodeRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("podcast_episodes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[podcast] admin list", error.message);
    return [];
  }

  return (data ?? []) as PodcastEpisodeRow[];
}

export async function fetchPodcastEpisodeByIdForAdmin(
  id: string,
): Promise<PodcastEpisodeRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("podcast_episodes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[podcast] admin by id", error.message);
    return null;
  }

  return data as PodcastEpisodeRow | null;
}
