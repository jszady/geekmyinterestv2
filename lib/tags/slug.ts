import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/posts/slug";

export async function resolveUniqueTagSlug(
  supabase: SupabaseClient,
  baseInput: string,
  excludeTagId?: string,
): Promise<string> {
  const root = slugify(baseInput) || "tag";
  let candidate = root;
  let n = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      console.error("[tag slug] lookup failed", error.message);
      throw new Error(`Tag slug check failed: ${error.message}`);
    }
    if (!data || (excludeTagId && data.id === excludeTagId)) {
      return candidate;
    }
    n += 1;
    candidate = `${root}-${n}`;
  }
}
