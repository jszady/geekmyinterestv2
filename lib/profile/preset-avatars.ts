/** Public paths under `public/images/profile-pictures/` — must match deployed files. */
export const DEFAULT_PROFILE_IMAGE_PATH = "/images/profile-pictures/default-profile.png" as const;

/**
 * Preset JPGs under `public/images/profile-pictures/`.
 * Keep in sync with files on disk (currently pfp1–pfp44 and pfp46–pfp49; no pfp45.jpg).
 */
const PFP_JPG_PATHS = [
  "/images/profile-pictures/pfp1.jpg",
  "/images/profile-pictures/pfp2.jpg",
  "/images/profile-pictures/pfp3.jpg",
  "/images/profile-pictures/pfp4.jpg",
  "/images/profile-pictures/pfp5.jpg",
  "/images/profile-pictures/pfp6.jpg",
  "/images/profile-pictures/pfp7.jpg",
  "/images/profile-pictures/pfp8.jpg",
  "/images/profile-pictures/pfp9.jpg",
  "/images/profile-pictures/pfp10.jpg",
  "/images/profile-pictures/pfp11.jpg",
  "/images/profile-pictures/pfp12.jpg",
  "/images/profile-pictures/pfp13.jpg",
  "/images/profile-pictures/pfp14.jpg",
  "/images/profile-pictures/pfp15.jpg",
  "/images/profile-pictures/pfp16.jpg",
  "/images/profile-pictures/pfp17.jpg",
  "/images/profile-pictures/pfp18.jpg",
  "/images/profile-pictures/pfp19.jpg",
  "/images/profile-pictures/pfp20.jpg",
  "/images/profile-pictures/pfp21.jpg",
  "/images/profile-pictures/pfp22.jpg",
  "/images/profile-pictures/pfp23.jpg",
  "/images/profile-pictures/pfp24.jpg",
  "/images/profile-pictures/pfp25.jpg",
  "/images/profile-pictures/pfp26.jpg",
  "/images/profile-pictures/pfp27.jpg",
  "/images/profile-pictures/pfp28.jpg",
  "/images/profile-pictures/pfp29.jpg",
  "/images/profile-pictures/pfp30.jpg",
  "/images/profile-pictures/pfp31.jpg",
  "/images/profile-pictures/pfp32.jpg",
  "/images/profile-pictures/pfp33.jpg",
  "/images/profile-pictures/pfp34.jpg",
  "/images/profile-pictures/pfp35.jpg",
  "/images/profile-pictures/pfp36.jpg",
  "/images/profile-pictures/pfp37.jpg",
  "/images/profile-pictures/pfp38.jpg",
  "/images/profile-pictures/pfp39.jpg",
  "/images/profile-pictures/pfp40.jpg",
  "/images/profile-pictures/pfp41.jpg",
  "/images/profile-pictures/pfp42.jpg",
  "/images/profile-pictures/pfp43.jpg",
  "/images/profile-pictures/pfp44.jpg",
  "/images/profile-pictures/pfp46.jpg",
  "/images/profile-pictures/pfp47.jpg",
  "/images/profile-pictures/pfp48.jpg",
  "/images/profile-pictures/pfp49.jpg",
] as const;

/** All preset paths allowlisted for signup/settings and `profiles.avatar_url` preset values. */
export const PRESET_AVATAR_PATHS = [DEFAULT_PROFILE_IMAGE_PATH, ...PFP_JPG_PATHS] as const;

export type PresetAvatarPath = (typeof PRESET_AVATAR_PATHS)[number];

const ALLOWED = new Set<string>(PRESET_AVATAR_PATHS);

export function isAllowedPresetAvatarPath(path: string): path is PresetAvatarPath {
  return ALLOWED.has(path);
}

function presetLabelForPath(path: string): string {
  if (path === DEFAULT_PROFILE_IMAGE_PATH) return "Default";
  const m = path.match(/pfp(\d+)\.jpg$/i);
  return m ? `Preset ${m[1]}` : "Preset";
}

/** Presets for pickers (signup, complete profile, account settings). Order = display order. */
export const PRESET_AVATAR_OPTIONS: ReadonlyArray<{
  path: PresetAvatarPath;
  label: string;
}> = [
  { path: DEFAULT_PROFILE_IMAGE_PATH, label: "Default" },
  ...PFP_JPG_PATHS.map((path) => ({
    path,
    label: presetLabelForPath(path),
  })),
];
