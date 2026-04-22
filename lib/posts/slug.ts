import type { SupabaseClient } from "@supabase/supabase-js";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "post";
}

export async function resolveUniqueSlug(
  supabase: SupabaseClient,
  baseSlug: string,
  excludePostId?: string,
): Promise<string> {
  const root = slugify(baseSlug) || "post";
  let candidate = root;
  let n = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      console.error("[slug] lookup failed", error.message);
      throw new Error(`Slug check failed: ${error.message}`);
    }
    if (!data || (excludePostId && data.id === excludePostId)) {
      return candidate;
    }
    n += 1;
    candidate = `${root}-${n}`;
  }
}
