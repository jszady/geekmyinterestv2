"use server";

import { evaluateAdminGate } from "@/lib/auth/admin-gate";
import { getSessionUser } from "@/lib/auth/session";
import type { TagRow } from "@/lib/database.types";
import { slugify } from "@/lib/posts/slug";
import { resolveUniqueTagSlug } from "@/lib/tags/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { escapeIlikePattern } from "@/lib/text/ilike-escape";

export async function searchTagsAction(query: string): Promise<TagRow[]> {
  const session = await getSessionUser();
  const gate = evaluateAdminGate(session);
  if (!gate.ok) return [];

  const q = query.trim();
  if (q.length < 1) return [];

  const supabase = await createSupabaseServerClient();
  const pattern = `%${escapeIlikePattern(q)}%`;
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug, created_at")
    .ilike("name", pattern)
    .order("name", { ascending: true })
    .limit(16);

  if (error) {
    console.error("[tags] search", error.message);
    return [];
  }
  return (data ?? []) as TagRow[];
}

export type EnsureTagResult =
  | { ok: true; tag: TagRow }
  | { ok: false; error: string };

export async function ensureTagByNameAction(rawName: string): Promise<EnsureTagResult> {
  const session = await getSessionUser();
  const gate = evaluateAdminGate(session);
  if (!gate.ok) return { ok: false, error: "Unauthorized." };

  const name = rawName.trim();
  if (name.length < 1 || name.length > 120) {
    return { ok: false, error: "Tag name should be 1–120 characters." };
  }

  const supabase = await createSupabaseServerClient();
  const baseSlug = slugify(name);

  const { data: bySlug, error: slugErr } = await supabase
    .from("tags")
    .select("id, name, slug, created_at")
    .eq("slug", baseSlug)
    .maybeSingle();

  if (slugErr) {
    console.error("[tags] by slug", slugErr.message);
    return { ok: false, error: slugErr.message };
  }
  if (bySlug) return { ok: true, tag: bySlug as TagRow };

  const { data: byName, error: nameErr } = await supabase
    .from("tags")
    .select("id, name, slug, created_at")
    .ilike("name", name)
    .limit(2);

  if (nameErr) {
    console.error("[tags] by name", nameErr.message);
    return { ok: false, error: nameErr.message };
  }
  const exact =
    (byName ?? []).find((t: TagRow) => t.name.trim().toLowerCase() === name.toLowerCase()) ?? null;
  if (exact) return { ok: true, tag: exact };

  const slug = await resolveUniqueTagSlug(supabase, baseSlug);
  const { data: inserted, error: insErr } = await supabase
    .from("tags")
    .insert({ name, slug })
    .select("id, name, slug, created_at")
    .single();

  if (insErr) {
    if (insErr.code === "23505") {
      const { data: again } = await supabase
        .from("tags")
        .select("id, name, slug, created_at")
        .eq("slug", slug)
        .maybeSingle();
      if (again) return { ok: true, tag: again as TagRow };
    }
    console.error("[tags] insert", insErr.message);
    return { ok: false, error: insErr.message };
  }

  return { ok: true, tag: inserted as TagRow };
}
