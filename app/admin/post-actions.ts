"use server";

import { evaluateAdminGate } from "@/lib/auth/admin-gate";
import { getSessionUser } from "@/lib/auth/session";
import type { PostRow } from "@/lib/database.types";
import {
  postSectionIndices,
  sectionTopImageFormName,
  sectionTopVideoFormName,
  sectionImageFormName,
  sectionTextFormName,
  sectionVideoFormName,
} from "@/lib/posts/section-fields";
import { validateAdminImageUpload } from "@/lib/storage/validate-admin-image-upload";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUniqueSlug, slugify } from "@/lib/posts/slug";
import { normalizeRichTextForStorage } from "@/lib/content/rich-text-storage";
import { fetchTagSlugsByIds, fetchTagSlugsForPostId } from "@/lib/tags/queries";
import { readTagIdsFromFormData, syncPostTags } from "@/lib/tags/sync";
import { revalidatePath } from "next/cache";
import {
  collectStoragePathsFromContentBlocks,
  emptySectionFieldsPayload,
  mergeV2ImageBlocksFromFormData,
  parseAndValidateContentBlocksJson,
  postHasContentBlocks,
  type ContentBlock,
} from "@/lib/posts/content-blocks";

const BUCKET = "post-images";

function revalidateTagPaths(slugs: string[]) {
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/tag/${slug}`);
  }
}

async function requireAdmin() {
  const session = await getSessionUser();
  const gate = evaluateAdminGate(session);
  if (!gate.ok) return null;
  const supabase = await createSupabaseServerClient();
  return { supabase, userId: gate.session.user.id };
}

function firstUploadedFile(formData: FormData, field: string): File | null {
  for (const entry of formData.getAll(field)) {
    if (!entry || typeof entry === "string") continue;
    const file = entry as File;
    if (file.size > 0) return file;
  }
  return null;
}

async function tryUploadImageField(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  formData: FormData,
  field: string,
): Promise<{ path: string | null; error?: string }> {
  const file = firstUploadedFile(formData, field);
  if (!file) return { path: null };
  const checked = await validateAdminImageUpload(file);
  if (!checked.ok) {
    return { path: null, error: `${field}: ${checked.error}` };
  }
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const path = `${userId}/${Date.now()}-${field}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) {
    console.error(`[upload ${field}]`, error.message, error);
    return {
      path: null,
      error: `Upload failed (${field}): ${error.message}`,
    };
  }
  return { path };
}

async function uploadImageField(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  formData: FormData,
  field: string,
): Promise<string | null> {
  const r = await tryUploadImageField(supabase, userId, formData, field);
  if (r.error) throw new Error(r.error);
  return r.path;
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

function clearPathsUnderUser(paths: string[], userId: string): string[] {
  return [...new Set(paths.filter((p) => !!p && p.startsWith(`${userId}/`)))];
}

function getPath(
  row: Record<string, unknown>,
  key: string,
): string | null {
  const v = row[key];
  return typeof v === "string" && v.trim() ? v : null;
}

/** Build `section_N_*` from form. Optional media never overwrites DB on update unless cleared or replaced. */
async function buildSectionPayload(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  formData: FormData,
  existing: PostRow | null,
  mode: "create" | "update",
): Promise<{
  payload: Record<string, string | null>;
  clearedStoragePaths: string[];
  warnings: string[];
}> {
  const payload: Record<string, string | null> = {};
  const prev = existing as Record<string, unknown> | null;
  const clearedStoragePaths: string[] = [];
  const warnings: string[] = [];

  for (const n of postSectionIndices()) {
    const textKey = sectionTextFormName(n);
    const topImgKey = sectionTopImageFormName(n);
    const topVideoKey = sectionTopVideoFormName(n);
    const bottomImgKey = sectionImageFormName(n);
    const bottomVideoKey = sectionVideoFormName(n);
    const rawText = String(formData.get(textKey) ?? "");
    payload[textKey] = normalizeRichTextForStorage(rawText);

    const clearTopVideo =
      String(formData.get(`clear_${topVideoKey}`) ?? "") === "1";
    const clearBottomVideo =
      String(formData.get(`clear_${bottomVideoKey}`) ?? "") === "1";

    const rawTopVideo = String(formData.get(topVideoKey) ?? "").trim();
    if (rawTopVideo.length) {
      payload[topVideoKey] = rawTopVideo;
    } else if (clearTopVideo) {
      payload[topVideoKey] = null;
    } else if (mode === "update" && prev) {
      payload[topVideoKey] = getPath(prev, topVideoKey);
    } else {
      payload[topVideoKey] = null;
    }

    const rawBottomVideo = String(formData.get(bottomVideoKey) ?? "").trim();
    if (rawBottomVideo.length) {
      payload[bottomVideoKey] = rawBottomVideo;
    } else if (clearBottomVideo) {
      payload[bottomVideoKey] = null;
    } else if (mode === "update" && prev) {
      payload[bottomVideoKey] = getPath(prev, bottomVideoKey);
    } else {
      payload[bottomVideoKey] = null;
    }

    for (const imgKey of [topImgKey, bottomImgKey]) {
      const clearRequested = String(formData.get(`clear_${imgKey}`) ?? "") === "1";
      const uploadResult = await tryUploadImageField(
        supabase,
        userId,
        formData,
        imgKey,
      );
      if (uploadResult.error) {
        warnings.push(uploadResult.error);
      }
      const uploaded = uploadResult.path;
      if (uploaded) {
        payload[imgKey] = uploaded;
        if (mode === "update" && prev) {
          const oldPath = getPath(prev, imgKey);
          if (oldPath && oldPath !== uploaded) clearedStoragePaths.push(oldPath);
        }
      } else if (mode === "update" && prev) {
        const oldPath = getPath(prev, imgKey);
        if (clearRequested) {
          payload[imgKey] = null;
          if (oldPath) clearedStoragePaths.push(oldPath);
        } else {
          payload[imgKey] = oldPath;
        }
      } else {
        payload[imgKey] = null;
      }
    }
  }

  return { payload, clearedStoragePaths, warnings };
}

export type PostSaveResult =
  | { ok: true; id: string; warnings?: string[] }
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
    push(sectionTopImageFormName(n));
    push(sectionImageFormName(n));
  }
  paths.push(...collectStoragePathsFromContentBlocks(row.content_blocks));
  return paths;
}

async function prepareV2ContentBlocksFromForm(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  formData: FormData,
  existing: PostRow | null,
): Promise<
  | { ok: true; blocks: ContentBlock[]; pathsToRemove: string[] }
  | { ok: false; error: string }
> {
  const raw = String(formData.get("content_blocks_json") ?? "").trim();
  if (!raw) return { ok: false, error: "Missing article content blocks." };

  let draft: unknown[];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p) || p.length === 0) {
      return { ok: false, error: "Add at least one content block." };
    }
    draft = p;
  } catch {
    return { ok: false, error: "Invalid content blocks data." };
  }

  const uploadWrapper = (fd: FormData, field: string) =>
    uploadImageField(supabase, userId, fd, field);

  const merged = await mergeV2ImageBlocksFromFormData(draft, formData, uploadWrapper);

  const validated = parseAndValidateContentBlocksJson(JSON.stringify(merged));
  if (!validated.ok) return validated;

  const oldPaths = existing
    ? collectStoragePathsFromContentBlocks(existing.content_blocks)
    : [];
  const newPaths = collectStoragePathsFromContentBlocks(validated.blocks);
  const newSet = new Set(newPaths);
  const pathsToRemove = oldPaths.filter((p) => !newSet.has(p));

  return { ok: true, blocks: validated.blocks, pathsToRemove };
}

export async function createPostAction(formData: FormData): Promise<PostSaveResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "Unauthorized: admin only." };

  const { supabase, userId } = auth;

  try {
    const f = readPostFormMeta(formData);
    if (!f.title) return { ok: false, error: "Title is required." };

    const { payload: sections, warnings: sectionWarnings } = await buildSectionPayload(
      supabase,
      userId,
      formData,
      null,
      "create",
    );

    const warnings = [...sectionWarnings];
    const cardR = await tryUploadImageField(supabase, userId, formData, "card_image");
    if (cardR.error) warnings.push(cardR.error);
    const heroR = await tryUploadImageField(supabase, userId, formData, "hero_image");
    if (heroR.error) warnings.push(heroR.error);
    const card = cardR.path;
    const hero = heroR.path;

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

    const tagIds = readTagIdsFromFormData(formData);
    try {
      await syncPostTags(supabase, data.id, tagIds);
      revalidateTagPaths(await fetchTagSlugsByIds(tagIds));
    } catch (tagErr) {
      const msg = tagErr instanceof Error ? tagErr.message : String(tagErr);
      console.error("[create post] tags", msg);
      return { ok: false, error: msg };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return {
      ok: true,
      id: data.id,
      warnings: warnings.length ? warnings : undefined,
    };
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

    const clearCard = String(formData.get("clear_card_image") ?? "") === "1";
    const clearHero = String(formData.get("clear_hero_image") ?? "") === "1";

    const cardHeroPathsToRemove: string[] = [];
    const uploadWarnings: string[] = [];

    const cardR = await tryUploadImageField(supabase, userId, formData, "card_image");
    if (cardR.error) uploadWarnings.push(cardR.error);
    if (cardR.path) {
      if (row.card_image && row.card_image !== cardR.path) cardHeroPathsToRemove.push(row.card_image);
      card = cardR.path;
    } else if (clearCard) {
      if (row.card_image) cardHeroPathsToRemove.push(row.card_image);
      card = null;
    }

    const heroR = await tryUploadImageField(supabase, userId, formData, "hero_image");
    if (heroR.error) uploadWarnings.push(heroR.error);
    if (heroR.path) {
      if (row.hero_image && row.hero_image !== heroR.path) cardHeroPathsToRemove.push(row.hero_image);
      hero = heroR.path;
    } else if (clearHero) {
      if (row.hero_image) cardHeroPathsToRemove.push(row.hero_image);
      hero = null;
    }

    const {
      payload: sections,
      clearedStoragePaths,
      warnings: sectionWarnings,
    } = await buildSectionPayload(
      supabase,
      userId,
      formData,
      row,
      "update",
    );

    for (const w of sectionWarnings) uploadWarnings.push(w);

    const baseSlug = slugify(f.slugInput || f.title);
    const slug = await resolveUniqueSlug(supabase, baseSlug, postId);

    const slotForUpdate = f.homepage_slot;
    if (slotForUpdate && f.status === "published") {
      await clearPublishedHomepageSlotConflicts(supabase, slotForUpdate, postId);
    }

    const tagIds = readTagIdsFromFormData(formData);
    const oldTagSlugs = await fetchTagSlugsForPostId(postId);

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

    await removeStoragePaths(
      supabase,
      clearPathsUnderUser([...clearedStoragePaths, ...cardHeroPathsToRemove], userId),
    );

    try {
      await syncPostTags(supabase, postId, tagIds);
      const newSlugs = await fetchTagSlugsByIds(tagIds);
      revalidateTagPaths([...oldTagSlugs, ...newSlugs]);
    } catch (tagErr) {
      const msg = tagErr instanceof Error ? tagErr.message : String(tagErr);
      console.error("[update post] tags", msg);
      return { ok: false, error: msg };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath(`/articles/${slug}`);
    return {
      ok: true,
      id: postId,
      warnings: uploadWarnings.length ? uploadWarnings : undefined,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function createPostV2Action(
  formData: FormData,
): Promise<PostSaveResult> {
  const auth = await requireAdmin();
  if (!auth) return { ok: false, error: "Unauthorized: admin only." };

  const { supabase, userId } = auth;

  try {
    const f = readPostFormMeta(formData);
    if (!f.title) return { ok: false, error: "Title is required." };

    const prepared = await prepareV2ContentBlocksFromForm(
      supabase,
      userId,
      formData,
      null,
    );
    if (!prepared.ok) return { ok: false, error: prepared.error };

    const card = await uploadImageField(supabase, userId, formData, "card_image");
    const hero = await uploadImageField(supabase, userId, formData, "hero_image");

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
      content_blocks: prepared.blocks,
      ...emptySectionFieldsPayload(),
    };

    const { data, error } = await supabase.from("posts").insert(insert).select("id").single();

    if (error || !data) {
      console.error("[create post v2]", error?.message);
      return {
        ok: false,
        error: error?.message ?? "Insert failed.",
      };
    }

    const tagIds = readTagIdsFromFormData(formData);
    try {
      await syncPostTags(supabase, data.id, tagIds);
      revalidateTagPaths(await fetchTagSlugsByIds(tagIds));
    } catch (tagErr) {
      const msg = tagErr instanceof Error ? tagErr.message : String(tagErr);
      console.error("[create post v2] tags", msg);
      return { ok: false, error: msg };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, id: data.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[createPostV2Action]", msg);
    return { ok: false, error: msg };
  }
}

export async function updatePostV2Action(
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

    if (!postHasContentBlocks(row)) {
      return {
        ok: false,
        error:
          "This post is not a V2 block article. Use the classic editor at Edit post.",
      };
    }

    let card = row.card_image as string | null;
    let hero = row.hero_image as string | null;

    const clearCard = String(formData.get("clear_card_image") ?? "") === "1";
    const clearHero = String(formData.get("clear_hero_image") ?? "") === "1";

    const cardHeroPathsToRemove: string[] = [];

    const newCard = await uploadImageField(supabase, userId, formData, "card_image");
    if (newCard) {
      if (row.card_image && row.card_image !== newCard) cardHeroPathsToRemove.push(row.card_image);
      card = newCard;
    } else if (clearCard) {
      if (row.card_image) cardHeroPathsToRemove.push(row.card_image);
      card = null;
    }

    const newHero = await uploadImageField(supabase, userId, formData, "hero_image");
    if (newHero) {
      if (row.hero_image && row.hero_image !== newHero) cardHeroPathsToRemove.push(row.hero_image);
      hero = newHero;
    } else if (clearHero) {
      if (row.hero_image) cardHeroPathsToRemove.push(row.hero_image);
      hero = null;
    }

    const prepared = await prepareV2ContentBlocksFromForm(
      supabase,
      userId,
      formData,
      row,
    );
    if (!prepared.ok) return { ok: false, error: prepared.error };

    const baseSlug = slugify(f.slugInput || f.title);
    const slug = await resolveUniqueSlug(supabase, baseSlug, postId);

    const slotForUpdate = f.homepage_slot;
    if (slotForUpdate && f.status === "published") {
      await clearPublishedHomepageSlotConflicts(supabase, slotForUpdate, postId);
    }

    const tagIds = readTagIdsFromFormData(formData);
    const oldTagSlugs = await fetchTagSlugsForPostId(postId);

    const patch = {
      title: f.title,
      slug,
      excerpt: f.excerpt,
      category: f.category,
      status: f.status,
      homepage_slot: f.homepage_slot,
      card_image: card,
      hero_image: hero,
      content_blocks: prepared.blocks,
    };

    const { error } = await supabase.from("posts").update(patch).eq("id", postId);
    if (error) {
      console.error("[update post v2]", error.message);
      return { ok: false, error: error.message };
    }

    await removeStoragePaths(
      supabase,
      clearPathsUnderUser(
        [...cardHeroPathsToRemove, ...prepared.pathsToRemove],
        userId,
      ),
    );

    try {
      await syncPostTags(supabase, postId, tagIds);
      const newSlugs = await fetchTagSlugsByIds(tagIds);
      revalidateTagPaths([...oldTagSlugs, ...newSlugs]);
    } catch (tagErr) {
      const msg = tagErr instanceof Error ? tagErr.message : String(tagErr);
      console.error("[update post v2] tags", msg);
      return { ok: false, error: msg };
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
  const tagSlugsBeforeDelete = await fetchTagSlugsForPostId(postId);
  await removeStoragePaths(supabase, paths);

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidateTagPaths(tagSlugsBeforeDelete);
  if (typeof row.slug === "string" && row.slug) {
    revalidatePath(`/articles/${row.slug}`);
  }
  return { ok: true, id: postId };
}
