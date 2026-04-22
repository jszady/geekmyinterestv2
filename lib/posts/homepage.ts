import type { EditorialFeedLayout, PostCardData } from "@/components/feed/types";
import { editorialFeed as staticFallback } from "@/components/feed/featured-articles";
import {
  buildHomepageSlotMap,
  placementFromSlotMap,
} from "@/lib/posts/homepage-slots";
import {
  postRowToCardData,
  postRowToLatestCard,
} from "@/lib/posts/map-row-to-card";
import {
  fetchProfilesByIds,
  fetchPublishedPostsLatest,
  fetchPublishedPostsWithSlots,
} from "@/lib/posts/queries";

export async function buildHomepageData(): Promise<{
  editorial: EditorialFeedLayout;
  latest: PostCardData[];
}> {
  const [slotted, latestRows] = await Promise.all([
    fetchPublishedPostsWithSlots(),
    fetchPublishedPostsLatest(),
  ]);

  if (!latestRows.length) {
    return {
      editorial: {
        featured: staticFallback.featured,
        secondary: staticFallback.secondary,
        latest: staticFallback.latest,
      },
      latest: staticFallback.latest,
    };
  }

  const bySlot = buildHomepageSlotMap(slotted);
  const { main: mainRow, secondary: secondaryRows } = placementFromSlotMap(bySlot);

  /**
   * Featured band: ONLY posts with an explicit homepage_slot assignment.
   * Never promote unslotted published posts into these positions.
   */
  const featured = mainRow
    ? await postRowToCardData(mainRow)
    : staticFallback.featured;

  const pad = staticFallback.secondary;
  const secondary: PostCardData[] = [];
  for (let i = 0; i < secondaryRows.length; i++) {
    const row = secondaryRows[i];
    if (row) {
      secondary.push(await postRowToCardData(row));
    } else {
      secondary.push(pad[i]!);
    }
  }

  const authorIds = [...new Set(latestRows.map((r) => r.author_id))];
  const profiles = await fetchProfilesByIds(authorIds);
  const latest = await Promise.all(
    latestRows.map((row) =>
      postRowToLatestCard(
        row,
        profiles.get(row.author_id)?.username ?? null,
      ),
    ),
  );

  return {
    editorial: {
      featured,
      secondary,
      latest,
    },
    latest,
  };
}
