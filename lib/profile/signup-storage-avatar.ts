import "server-only";

import {
  assertAvatarFile,
  safeAvatarFilename,
  sniffAvatarBytes,
} from "@/lib/profile/avatar-upload";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "profile-images";

/**
 * Upload signup avatar file into `profile-images` for a freshly created user id.
 * Caller must use a client authorized to write this path (service role or session).
 */
export async function uploadProfileAvatarForNewUser(
  storageClient: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const checked = assertAvatarFile(file);
  if (!checked.ok) return { ok: false, error: checked.error };

  const buf = new Uint8Array(await file.arrayBuffer());
  const validMagic = await sniffAvatarBytes(buf, checked.mime);
  if (!validMagic) {
    return { ok: false, error: "File content does not match a supported image type." };
  }

  const safeName = safeAvatarFilename(file.name, checked.mime);
  const objectPath = `${userId}/${Date.now()}-signup-${safeName}`;

  const { error: upErr } = await storageClient.storage.from(BUCKET).upload(objectPath, buf, {
    contentType: checked.mime,
    upsert: false,
  });
  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const { data: pub } = storageClient.storage.from(BUCKET).getPublicUrl(objectPath);
  const publicUrl = pub.publicUrl?.trim();
  if (!publicUrl) {
    await storageClient.storage.from(BUCKET).remove([objectPath]);
    return { ok: false, error: "Could not resolve avatar URL after upload." };
  }

  return { ok: true, publicUrl };
}
