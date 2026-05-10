"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type FooterVisibilityContextValue = {
  /** False while any App Router `loading.tsx` overlay using `LoadingShell` is mounted. */
  showSiteFooter: boolean;
  beginRouteLoading: () => void;
  endRouteLoading: () => void;
};

const FooterVisibilityContext = createContext<FooterVisibilityContextValue | null>(
  null,
);

export function FooterVisibilityProvider({ children }: { children: ReactNode }) {
  const depthRef = useRef(0);
  const [suppressed, setSuppressed] = useState(false);

  const beginRouteLoading = useCallback(() => {
    depthRef.current += 1;
    if (depthRef.current === 1) setSuppressed(true);
  }, []);

  const endRouteLoading = useCallback(() => {
    depthRef.current = Math.max(0, depthRef.current - 1);
    if (depthRef.current === 0) setSuppressed(false);
  }, []);

  const value = useMemo<FooterVisibilityContextValue>(
    () => ({
      showSiteFooter: !suppressed,
      beginRouteLoading,
      endRouteLoading,
    }),
    [suppressed, beginRouteLoading, endRouteLoading],
  );

  return (
    <FooterVisibilityContext.Provider value={value}>
      {children}
    </FooterVisibilityContext.Provider>
  );
}

export function useFooterVisibility(): FooterVisibilityContextValue {
  const ctx = useContext(FooterVisibilityContext);
  if (!ctx) {
    throw new Error("useFooterVisibility must be used within FooterVisibilityProvider");
  }
  return ctx;
}
