import type { SupabaseClient } from "@supabase/supabase-js";

export function slugifyPodcast(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "podcast-episode";
}

export async function resolveUniquePodcastSlug(
  supabase: SupabaseClient,
  baseSlug: string,
  excludeEpisodeId?: string,
): Promise<string> {
  const root = slugifyPodcast(baseSlug) || "podcast-episode";
  let candidate = root;
  let n = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("podcast_episodes")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(`Podcast slug check failed: ${error.message}`);
    }

    if (!data || (excludeEpisodeId && data.id === excludeEpisodeId)) {
      return candidate;
    }

    n += 1;
    candidate = `${root}-${n}`;
  }
}
