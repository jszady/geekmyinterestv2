"use server";

import {
  setPresetProfileAvatarAction,
  uploadProfileAvatarAction,
  type AvatarUploadResult,
  type PresetAvatarResult,
} from "@/app/account/avatar-actions";
import { userHasEmailPasswordIdentity } from "@/lib/auth/identity";
import { isAdmin } from "@/lib/auth/roles";
import {
  assertAuthorHeaderFile,
  safeAvatarFilename,
  sniffAvatarBytes,
} from "@/lib/profile/avatar-upload";
import type { ProfileRow } from "@/lib/database.types";
import { authorHeaderStoredToObjectPath } from "@/lib/profile/author-header-display-url";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import { createEphemeralAnonAuthClient } from "@/lib/supabase/ephemeral-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const AUTHOR_HEADERS_BUCKET = "author-headers";
const BIO_MAX = 5000;


export async function updateAvatarAction(formData: FormData): Promise<PresetAvatarResult> {
  return setPresetProfileAvatarAction(formData);
}

export async function uploadAvatarAction(formData: FormData): Promise<AvatarUploadResult> {
  return uploadProfileAvatarAction(formData);
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export async function updatePasswordAction(formData: FormData): Promise<ActionResult> {
  const oldPassword = String(formData.get("old_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!oldPassword || !newPassword || !confirm) {
    return { ok: false, error: "All password fields are required." };
  }
  if (newPassword !== confirm) {
    return { ok: false, error: "New password and confirmation do not match." };
  }
  if (newPassword.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }
  if (newPassword === oldPassword) {
    return { ok: false, error: "New password must be different from your current password." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user?.email) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!userHasEmailPasswordIdentity(user)) {
    return {
      ok: false,
      error: "Password changes are only available for email/password accounts.",
    };
  }

  const ephemeral = createEphemeralAnonAuthClient();
  const { data: signData, error: signErr } = await ephemeral.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  });

  if (signErr || signData.user?.id !== user.id) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const { error: upErr } = await supabase.auth.updateUser({ password: newPassword });
  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  revalidatePath("/account/settings");
  return { ok: true, message: "Password updated." };
}

export async function deleteAccountAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "You must be signed in." };
  }
  if (!userHasEmailPasswordIdentity(user)) {
    return {
      ok: false,
      error:
        "Account deletion with password confirmation is not available for Google or other social sign-in. Please contact support to remove your account.",
    };
  }

  const email = user.email;
  if (!email) {
    return { ok: false, error: "No email on file for this account." };
  }

  const password = String(formData.get("password") ?? "").trim();
  if (!password) {
    return { ok: false, error: "Enter your password to confirm account deletion." };
  }

  const ephemeral = createEphemeralAnonAuthClient();
  const { data: signData, error: signErr } = await ephemeral.auth.signInWithPassword({
    email,
    password,
  });

  if (signErr || signData.user?.id !== user.id) {
    return { ok: false, error: "Incorrect password. Account was not deleted." };
  }

  let admin;
  try {
    admin = createSupabaseServiceRoleClient();
  } catch {
    return {
      ok: false,
      error: "Server configuration error. Try again later or contact support.",
    };
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) {
    return { ok: false, error: delErr.message };
  }

  try {
    await supabase.auth.signOut();
  } catch {
    /* session may already be invalid */
  }
  revalidatePath("/", "layout");
  redirect("/?account_deleted=1");
}

export async function updateAdminAuthorProfileAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "You must be signed in." };
  }

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role, author_header_image")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || !profile) {
    return { ok: false, error: profErr?.message ?? "Profile not found." };
  }
  if (!isAdmin(profile as ProfileRow)) {
    return { ok: false, error: "Only admins can update author bio and header." };
  }

  const bio = String(formData.get("bio") ?? "").trim().slice(0, BIO_MAX);
  const file = formData.get("author_header");

  const updatePayload: { bio: string | null; author_header_image?: string } = {
    bio: bio.length ? bio : null,
  };

  if (file instanceof File && file.size > 0) {
    const checked = assertAuthorHeaderFile(file);
    if (!checked.ok) {
      return { ok: false, error: checked.error };
    }
    const buf = new Uint8Array(await file.arrayBuffer());
    const validMagic = await sniffAvatarBytes(buf, checked.mime);
    if (!validMagic) {
      return { ok: false, error: "Header image content does not match a supported type." };
    }

    const oldStored = (profile as { author_header_image?: string | null }).author_header_image ?? null;
    const oldPath = authorHeaderStoredToObjectPath(oldStored);

    const safeName = safeAvatarFilename(file.name, checked.mime);
    // RLS policy requires {userId}/ as the first path component
    const uploadRequestPath = `${user.id}/${Date.now()}-author-header-${safeName}`;

    const uploadResult = await supabase.storage.from(AUTHOR_HEADERS_BUCKET).upload(uploadRequestPath, buf, {
      contentType: checked.mime,
      upsert: false,
    });

    if (uploadResult.error) {
      return { ok: false, error: uploadResult.error.message };
    }

    const uploaded = uploadResult.data as { path?: string; fullPath?: string } | null;

    console.log(
      "[author-header-upload] full Supabase upload result",
      JSON.stringify({ data: uploaded, error: uploadResult.error }),
    );

    // data.path is the exact confirmed bucket-relative object path from Supabase
    const finalAuthorHeaderImage = (uploaded?.path ?? "").trim() || uploadRequestPath;

    if (!finalAuthorHeaderImage || finalAuthorHeaderImage.includes("..")) {
      return {
        ok: false,
        error: "Upload finished but no object path could be resolved.",
      };
    }

    console.log(
      "[author-header-upload] path summary",
      JSON.stringify({
        uploadRequestPath,
        uploadResponseDataPath: uploaded?.path ?? null,
        uploadResponseDataFullPath: uploaded?.fullPath ?? null,
        finalSavedAuthorHeaderImage: finalAuthorHeaderImage,
      }),
    );

    if (oldPath && oldPath !== finalAuthorHeaderImage) {
      await supabase.storage.from(AUTHOR_HEADERS_BUCKET).remove([oldPath]);
    }

    updatePayload.author_header_image = finalAuthorHeaderImage;
  }

  const { error: updErr } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (updErr) {
    return { ok: false, error: updErr.message };
  }

  const { data: nameRow } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  const uname = nameRow?.username?.trim();
  if (uname) {
    revalidatePath(`/authors/${encodeURIComponent(uname)}`);
  }
  revalidatePath("/account/settings");
  return { ok: true, message: "Author profile updated." };
}
