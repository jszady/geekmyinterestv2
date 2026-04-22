import type { HomepageSlot, PostRow } from "@/lib/database.types";

/**
 * Visual layout order (must match `EditorialLeadSection` / `FEATURE_SLOTS` in homepage data).
 * secondary[0] → feature_1 … secondary[5] → feature_6
 */
export const HOMEPAGE_FEATURE_SLOTS: Exclude<HomepageSlot, "main_feature">[] = [
  "feature_1",
  "feature_2",
  "feature_3",
  "feature_4",
  "feature_5",
  "feature_6",
];

/**
 * Map of explicit homepage_slot → post. Empty / null slots on rows are ignored.
 */
export function buildHomepageSlotMap(posts: PostRow[]): Map<string, PostRow> {
  const m = new Map<string, PostRow>();
  for (const p of posts) {
    const slot = p.homepage_slot;
    if (slot && typeof slot === "string" && slot.trim()) {
      m.set(slot.trim(), p);
    }
  }
  return m;
}

export type FeaturedRowPlacement = {
  /** Resolved `main_feature` row, if any */
  main: PostRow | null;
  /**
   * Six fixed positions matching `HOMEPAGE_FEATURE_SLOTS` indices.
   * `null` means no published post holds that slot (UI may show a static placeholder).
   */
  secondary: (PostRow | null)[];
};

/**
 * Pure placement from slotted published posts only. Does not pull unslotted posts into any slot.
 */
export function placementFromSlotMap(bySlot: Map<string, PostRow>): FeaturedRowPlacement {
  const main = bySlot.get("main_feature") ?? null;
  const secondary: (PostRow | null)[] = HOMEPAGE_FEATURE_SLOTS.map(
    (slot) => bySlot.get(slot) ?? null,
  );
  return { main, secondary };
}
