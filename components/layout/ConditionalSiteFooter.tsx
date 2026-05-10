"use client";

import { useFooterVisibility } from "@/components/layout/footer-visibility-context";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { usePathname } from "next/navigation";

const HIDDEN_PREFIXES = ["/admin"];

export function ConditionalSiteFooter() {
  const pathname = usePathname();
  const { showSiteFooter } = useFooterVisibility();

  if (!pathname) return null;
  if (!showSiteFooter) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return <SiteFooter />;
}
