"use client";

import { useFooterVisibility } from "@/components/layout/footer-visibility-context";
import { useLayoutEffect, type ReactNode } from "react";

/**
 * Wrap App Router `loading.tsx` content so the global site footer is hidden
 * for the duration of the loading overlay (ref-counted for nested loading segments).
 */
export function LoadingShell({ children }: { children: ReactNode }) {
  const { beginRouteLoading, endRouteLoading } = useFooterVisibility();

  useLayoutEffect(() => {
    beginRouteLoading();
    return () => endRouteLoading();
  }, [beginRouteLoading, endRouteLoading]);

  return <>{children}</>;
}
