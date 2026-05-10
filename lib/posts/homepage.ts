import type { EditorialFeedLayout, PostCardData } from "@/components/feed/types";
import { editorialFeed as staticFallback } from "@/components/feed/featured-articles";
import type { LatestListCat } from "@/lib/posts/latest-list-params";
import {
  dbCategoryFromLatestListCat,
  LATEST_PER_PAGE,
} from "@/lib/posts/latest-list-params";
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
  fetchPublishedPostsCount,
  fetchPublishedPostsPage,
  fetchPublishedPostsWithSlots,
} from "@/lib/posts/queries";

export type HomepageLatestMeta = {
  page: number;
  totalCount: number;
  perPage: number;
  cat: LatestListCat;
};

export async function buildHomepageData(options?: {
  latestPage?: number;
  latestCat?: LatestListCat;
}): Promise<{
  editorial: EditorialFeedLayout;
  latest: PostCardData[];
  latestMeta: HomepageLatestMeta;
}> {
  const latestCat = options?.latestCat ?? "all";
  const requestedPage = options?.latestPage ?? 1;
  const perPage = LATEST_PER_PAGE;
  const dbCat = dbCategoryFromLatestListCat(latestCat);

  const [slotted, publishedTotal] = await Promise.all([
    fetchPublishedPostsWithSlots(),
    fetchPublishedPostsCount(null),
  ]);

  if (publishedTotal === 0 && slotted.length === 0) {
    const latest = staticFallback.latest;
    return {
      editorial: {
        featured: staticFallback.featured,
        secondary: staticFallback.secondary,
        latest: [],
      },
      latest,
      latestMeta: {
        page: 1,
        totalCount: latest.length,
        perPage,
        cat: latestCat,
      },
    };
  }

  const bySlot = buildHomepageSlotMap(slotted);
  const { main: mainRow, secondary: secondaryRows } = placementFromSlotMap(bySlot);

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

  const filteredTotal = await fetchPublishedPostsCount(dbCat);
  const totalPages = Math.max(1, Math.ceil(filteredTotal / perPage));
  const page = Math.min(Math.max(1, requestedPage), totalPages);

  const latestRows = await fetchPublishedPostsPage(page, perPage, dbCat);

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
      latest: [],
    },
    latest,
    latestMeta: {
      page,
      totalCount: filteredTotal,
      perPage,
      cat: latestCat,
    },
  };
}
