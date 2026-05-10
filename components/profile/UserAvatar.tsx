"use client";

import { isRemoteAvatarUrl, resolveProfileAvatarUrl } from "@/lib/profile/avatar-display";
import { profileInitials } from "@/lib/profile/initials";
import Image from "next/image";
import { useState } from "react";

const sizeClasses = {
  xs: "h-7 w-7 min-h-7 min-w-7 text-[10px]",
  sm: "h-9 w-9 min-h-9 min-w-9 text-xs",
  md: "h-11 w-11 min-h-11 min-w-11 text-sm",
  lg: "h-14 w-14 min-h-14 min-w-14 text-base",
  hero:
    "h-28 w-28 min-h-28 min-w-28 text-2xl sm:h-32 sm:w-32 sm:min-h-32 sm:min-w-32 sm:text-3xl md:h-36 md:w-36 md:min-h-36 md:min-w-36",
} as const;

export type UserAvatarSize = keyof typeof sizeClasses;

type Props = {
  username: string | null | undefined;
  /** Used for initials when username is empty (e.g. before profile completion). */
  email?: string | null;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
  /** When true, hide image from assistive tech (use next to visible name). */
  decorative?: boolean;
};

export function UserAvatar({
  username,
  email,
  avatarUrl,
  size = "sm",
  className = "",
  decorative = true,
}: Props) {
  const [broken, setBroken] = useState(false);
  const initialsSource = username?.trim() || email?.split("@")[0]?.trim() || null;
  const initials = profileInitials(initialsSource);
  const resolved = resolveProfileAvatarUrl(avatarUrl);
  const showImage = !broken;

  const ring =
    "rounded-full border border-white/10 bg-gradient-to-br from-[#0a1428] to-[#050a14] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";

  if (showImage) {
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden ${ring} ${sizeClasses[size]} ${className}`}
      >
        <Image
          src={resolved}
          alt={decorative ? "" : `Profile photo for ${initialsSource ?? "member"}`}
          fill
          className="object-cover object-center"
          sizes={
            size === "hero"
              ? "144px"
              : size === "lg"
                ? "56px"
                : size === "md"
                  ? "44px"
                  : "36px"
          }
          onError={() => setBroken(true)}
          unoptimized={isRemoteAvatarUrl(resolved)}
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-semibold tracking-tight text-cyan-100/95 ${ring} ${sizeClasses[size]} ${className}`}
      aria-hidden={decorative}
    >
      {initials}
    </span>
  );
}
