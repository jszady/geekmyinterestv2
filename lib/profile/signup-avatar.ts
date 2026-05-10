import {
  DEFAULT_PROFILE_IMAGE_PATH,
  isAllowedPresetAvatarPath,
} from "@/lib/profile/preset-avatars";

const PREFIX = "/images/profile-pictures/";

function isProfileImagesPublicUrl(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.startsWith("https://") &&
    lower.includes("/storage/v1/object/public/profile-images/")
  );
}

/**
 * Validates avatar path from signup form. Rejects empty, non-prefix, and non-allowlisted values.
 */
export function parseSignupAvatarFromForm(formData: FormData): string {
  const raw = String(formData.get("avatar_url") ?? "").trim();
  if (!raw) return DEFAULT_PROFILE_IMAGE_PATH;
  if (!raw.startsWith(PREFIX)) return DEFAULT_PROFILE_IMAGE_PATH;
  if (!isAllowedPresetAvatarPath(raw)) return DEFAULT_PROFILE_IMAGE_PATH;
  return raw;
}

/** Read avatar from auth user_metadata (preset path or uploaded profile-images public URL). */
export function avatarFromSignupMetadata(
  meta: Record<string, unknown> | null | undefined,
): string | null {
  const raw = meta && typeof meta.signup_avatar_url === "string" ? meta.signup_avatar_url.trim() : "";
  if (!raw) return null;
  if (raw.startsWith(PREFIX) && isAllowedPresetAvatarPath(raw)) return raw;
  if (isProfileImagesPublicUrl(raw)) return raw;
  return null;
}
