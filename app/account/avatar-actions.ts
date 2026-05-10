"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  assertAvatarFile,
  profileImageObjectPathFromPublicUrl,
  safeAvatarFilename,
  sniffAvatarBytes,
} from "@/lib/profile/avatar-upload";
import { isAllowedPresetAvatarPath } from "@/lib/profile/preset-avatars";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "profile-images";

export type AvatarUploadResult =
  | { ok: true; avatarUrl: string }
  | { ok: false; error: string };

export type PresetAvatarResult = { ok: true; avatarUrl: string } | { ok: false; error: string };

async function revalidateAvatarPaths(supabase: SupabaseClient, userId: string) {
  const { data: nameRow } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  const uname = nameRow?.username?.trim();
  if (uname) {
    revalidatePath(`/authors/${encodeURIComponent(uname)}`);
  }
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/account/settings");
  revalidatePath("/complete-profile");
}

export async function setPresetProfileAvatarAction(formData: FormData): Promise<PresetAvatarResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "You must be logged in." };
  }

  const raw = String(formData.get("presetPath") ?? "").trim();
  if (!isAllowedPresetAvatarPath(raw)) {
    return { ok: false, error: "Invalid avatar choice." };
  }

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile) {
    return { ok: false, error: profErr?.message ?? "Profile not found." };
  }

  const oldUrl = profile.avatar_url ?? null;
  const oldPath = oldUrl ? profileImageObjectPathFromPublicUrl(oldUrl) : null;
  if (oldPath?.startsWith(`${user.id}/`)) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  const { error: updErr } = await supabase
    .from("profiles")
    .update({ avatar_url: raw })
    .eq("id", user.id);

  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  await revalidateAvatarPaths(supabase, user.id);
  return { ok: true, avatarUrl: raw };
}

export async function uploadProfileAvatarAction(formData: FormData): Promise<AvatarUploadResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "You must be logged in." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return { ok: false, error: "Missing file." };
  }

  const checked = assertAvatarFile(file);
  if (!checked.ok) return checked;

  const buf = new Uint8Array(await file.arrayBuffer());
  const validMagic = await sniffAvatarBytes(buf, checked.mime);
  if (!validMagic) {
    return { ok: false, error: "File content does not match a supported image type." };
  }

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile) {
    return { ok: false, error: profErr?.message ?? "Profile not found." };
  }

  const oldUrl = profile.avatar_url ?? null;
  const oldPath = oldUrl ? profileImageObjectPathFromPublicUrl(oldUrl) : null;
  if (oldPath?.startsWith(`${user.id}/`)) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  const safeName = safeAvatarFilename(file.name, checked.mime);
  const objectPath = `${user.id}/${Date.now()}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, buf, {
      contentType: checked.mime,
      upsert: false,
    });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const avatarUrl = pub.publicUrl;

  const { error: updErr } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updErr) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return { ok: false, error: updErr.message };
  }

  await revalidateAvatarPaths(supabase, user.id);
  return { ok: true, avatarUrl };
}
