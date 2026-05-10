import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function normalizeTagIds(tagIds: string[]): string[] {
  return [...new Set(tagIds.map((id) => id.trim()).filter((id) => UUID_RE.test(id)))];
}

export async function syncPostTags(
  supabase: SupabaseClient,
  postId: string,
  tagIds: string[],
): Promise<void> {
  const unique = normalizeTagIds(tagIds);
  const { data: existing, error: exErr } = await supabase
    .from("post_tags")
    .select("tag_id")
    .eq("post_id", postId);
  if (exErr) {
    console.error("[post_tags] read", exErr.message);
    throw new Error(`Could not read tags: ${exErr.message}`);
  }
  const oldSet = new Set((existing ?? []).map((r: { tag_id: string }) => r.tag_id));
  const newSet = new Set(unique);
  const toRemove = [...oldSet].filter((id) => !newSet.has(id));
  const toAdd = [...newSet].filter((id) => !oldSet.has(id));

  if (toRemove.length) {
    const { error: delErr } = await supabase
      .from("post_tags")
      .delete()
      .eq("post_id", postId)
      .in("tag_id", toRemove);
    if (delErr) {
      console.error("[post_tags] delete subset", delErr.message);
      throw new Error(`Could not update tags: ${delErr.message}`);
    }
  }
  if (!toAdd.length) return;
  const rows = toAdd.map((tag_id) => ({ post_id: postId, tag_id }));
  const { error: insErr } = await supabase.from("post_tags").insert(rows);
  if (insErr) {
    console.error("[post_tags] insert", insErr.message);
    throw new Error(`Could not save tags: ${insErr.message}`);
  }
}

export function readTagIdsFromFormData(formData: FormData): string[] {
  const raw = formData.getAll("tag_id");
  return raw.map((x) => String(x ?? "").trim()).filter(Boolean);
}
