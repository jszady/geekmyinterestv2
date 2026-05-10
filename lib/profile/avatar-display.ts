import { DEFAULT_PROFILE_IMAGE_PATH } from "@/lib/profile/preset-avatars";

/**
 * URL used when rendering an avatar: DB value if set, otherwise bundled default preset.
 */
export function resolveProfileAvatarUrl(avatarUrl: string | null | undefined): string {
  const t = (avatarUrl ?? "").trim();
  return t || DEFAULT_PROFILE_IMAGE_PATH;
}

export function isRemoteAvatarUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}
