"use server";

import { evaluateAdminGate } from "@/lib/auth/admin-gate";
import { getSessionUser } from "@/lib/auth/session";
import type { PostRow } from "@/lib/database.types";
import {
  postSectionIndices,
  sectionImageFormName,
  sectionTextFormName,
} from "@/lib/posts/section-fields";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUniqueSlug, slugify } from "@/lib/posts/slug";
import { revalidatePath } from "next/cache";

const BUCKET = "post-images";

async function requireAdmin() {
  const session = await getSessionUser();
  const gate = evaluateAdminGate(session);
  if (!gate.ok) return null;
  const supabase = await createSupabaseServerClient();
  return { supabase, userId: gate.session.user.id };
}

async function uploadImageField(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  formData: FormData,
  field: string,
): Promise<string | null> {
  const raw = formData.get(field);
  if (!raw || typeof raw === "string") return null;
  const file = raw as File;
  if (!file.size) return null;
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const path = `${userId}/${Date.now()}-${field}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error(`[upload ${field}]`, error.message, error);
    throw new Error(`Upload failed (${field}): ${error.message}`);
  }
  return path;
}

/**
 * Clears `homepage_slot` on other **published** posts using `slot`, so the unique
 * `unique_published_homepage_slot` constraint is satisfied before we assign `slot`
 * to the post being created or updated.
 *
 * @param excludePostId — When updating, exclude this row (it may still hold its old slot until the next update). When creating, pass `null` to clear every published occupant of `slot`.
 */
async function clearPublishedHomepageSlotConflicts(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  slot: string,
  excludePostId: string | null,
) {
  let q = supabase
    .from("posts")
    .update({ homepage_slot: null })
    .eq("homepage_slot", slot)
    .eq("status", "published");

  if (excludePostId) {
    q = q.neq("id", excludePostId);
  }

  const { error } = await q;
  if (error) {
    console.error("[homepage_slot] clear conflicts", error.message);
    throw new Error(`Could not free homepage slot: ${error.message}`);
  }
}


async function removeStoragePaths(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  paths: (string | null | undefined)[],
) {
  const keys = paths.filter((p): p is string => !!p?.trim());
  if (!keys.length) return;
  const { error } = await supabase.storage.from(BUCKET).remove(keys);
  if (error) console.error("[storage remove]", error.message);
}

function getPath(
  row: Record<string, unknown>,
  key: string,
): string | null {
  const v = row[key];
  return typeof v === "string" && v.trim() ? v : null;
}

/** Build `section_N_text` / `section_N_image` from form; preserve existing image paths on update when no new file. */
async function buildSectionPayload(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  formData: FormData,
  existing: PostRow | null,
  mode: "create" | "update",
): Promise<Record<string, string | null>> {
  const payload: Record<string, string | null> = {};
  const prev = existing as Record<string, unknown> | null;

  for (const n of postSectionIndices()) {
    const textKey = sectionTextFormName(n);
    const imgKey = sectionImageFormName(n);
    const rawText = String(formData.get(textKey) ?? "").trim();
    payload[textKey] = rawText.length ? rawText : null;

    const uploaded = await uploadImageField(supabase, userId, formData, imgKey);
    if (uploaded) {
      payload[imgKey] = uploaded;
    } else if (mode === "update" && prev) {
      payload[imgKey] = getPath(prev, imgKey);
    } else {
      payload[imgKey] = null;
    }
  }

  return payload;
}

export type PostSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function readPostFormMeta(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const homepage_slot_raw = String(formData.get("homepage_slot") ?? "").trim();
  const homepage_slot =
    homepage_slot_raw === "" || homepage_slot_raw === "none"
      ? null
      : homepage_slot_raw;
  return {
    title,
    slugInput,
    excerpt,
    category,
    status,
    homepage_slot,
  };
}

function allPostImagePathsFromRow(row: Record<string, unknown>): string[] {
  const paths: string[] = [];
  const push = (k: string) => {
    const v = getPath(row, k);
    if (v) paths.push(v);
  };
  push("card_image");
  push("hero_image");
  push("inline_image");
  for (const n of postSectionIndices()) {
    push(sectionImageFormName(n));
  }
  return paths;
}

export async function createPostAction(formData: FormData): Promise<PostSaveResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "Unauthorized: admin only." };

  const { supabase, userId } = auth;

  try {
    const f = readPostFormMeta(formData);
    if (!f.title) return { ok: false, error: "Title is required." };

    const card = await uploadImageField(supabase, userId, formData, "card_image");
    const hero = await uploadImageField(supabase, userId, formData, "hero_image");

    const sections = await buildSectionPayload(
      supabase,
      userId,
      formData,
      null,
      "create",
    );

    const baseSlug = slugify(f.slugInput || f.title);
    const slug = await resolveUniqueSlug(supabase, baseSlug);

    const slotForCreate = f.homepage_slot;
    if (slotForCreate && f.status === "published") {
      await clearPublishedHomepageSlotConflicts(supabase, slotForCreate, null);
    }

    const insert = {
      title: f.title,
      slug,
      excerpt: f.excerpt,
      category: f.category,
      status: f.status,
      homepage_slot: f.homepage_slot,
      card_image: card,
      hero_image: hero,
      inline_image: null,
      body_part_1: null,
      body_part_2: null,
      author_id: userId,
      ...sections,
    };

    const { data, error } = await supabase
      .from("posts")
      .insert(insert)
      .select("id")
      .single();

    if (error || !data) {
      console.error("[create post]", error?.message);
      return {
        ok: false,
        error: error?.message ?? "Insert failed.",
      };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[createPostAction]", msg);
    return { ok: false, error: msg };
  }
}

export async function updatePostAction(
  postId: string,
  formData: FormData,
): Promise<PostSaveResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "Unauthorized: admin only." };
  const { supabase, userId } = auth;

  try {
    const f = readPostFormMeta(formData);
    if (!f.title) return { ok: false, error: "Title is required." };

    const { data: existing, error: exErr } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();
    if (exErr || !existing) {
      return { ok: false, error: exErr?.message ?? "Post not found." };
    }

    const row = existing as PostRow;

    let card = row.card_image as string | null;
    let hero = row.hero_image as string | null;

    const newCard = await uploadImageField(supabase, userId, formData, "card_image");
    if (newCard) card = newCard;
    const newHero = await uploadImageField(supabase, userId, formData, "hero_image");
    if (newHero) hero = newHero;

    const sections = await buildSectionPayload(
      supabase,
      userId,
      formData,
      row,
      "update",
    );

    const baseSlug = slugify(f.slugInput || f.title);
    const slug = await resolveUniqueSlug(supabase, baseSlug, postId);

    const slotForUpdate = f.homepage_slot;
    if (slotForUpdate && f.status === "published") {
      await clearPublishedHomepageSlotConflicts(supabase, slotForUpdate, postId);
    }

    const patch = {
      title: f.title,
      slug,
      excerpt: f.excerpt,
      category: f.category,
      status: f.status,
      homepage_slot: f.homepage_slot,
      card_image: card,
      hero_image: hero,
      ...sections,
    };

    const { error } = await supabase.from("posts").update(patch).eq("id", postId);
    if (error) {
      console.error("[update post]", error.message);
      return { ok: false, error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/articles/${slug}`);
    return { ok: true, id: postId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function deletePostAction(postId: string): Promise<PostSaveResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "Unauthorized: admin only." };
  const { supabase } = auth;

  const { data: row, error: gErr } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (gErr || !row) {
    return { ok: false, error: gErr?.message ?? "Post not found." };
  }

  const paths = allPostImagePathsFromRow(row as Record<string, unknown>);
  await removeStoragePaths(supabase, paths);

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  if (typeof row.slug === "string" && row.slug) {
    revalidatePath(`/articles/${row.slug}`);
  }
  return { ok: true, id: postId };
}
