"use client";

import { isRemoteAvatarUrl } from "@/lib/profile/avatar-display";
import Image from "next/image";
import { useState } from "react";

/** Small preview tile; hides on error so a background layer can show through. */
export function AuthorHeaderThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  const t = src.trim();
  if (!t || failed) return null;

  return (
    <div className="absolute inset-0 z-[1]" aria-hidden>
      <Image
        src={t}
        alt=""
        fill
        className="object-cover object-center"
        unoptimized={isRemoteAvatarUrl(t)}
        sizes="672px"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
