import type { PostRow } from "@/lib/database.types";
import {
  HOMEPAGE_FEATURE_SLOTS,
  buildHomepageSlotMap,
  placementFromSlotMap,
} from "@/lib/posts/homepage-slots";

function row(
  id: string,
  title: string,
  slug: string,
  slot: PostRow["homepage_slot"],
): PostRow {
  return {
    id,
    title,
    slug,
    excerpt: null,
    category: "Movie",
    status: "published",
    homepage_slot: slot,
    card_image: null,
    hero_image: null,
    inline_image: null,
    body_part_1: null,
    body_part_2: null,
    author_id: "author-1",
    created_at: new Date().toISOString(),
  };
}

describe("HOMEPAGE_FEATURE_SLOTS", () => {
  it("lists feature_1 through feature_6 in visual order", () => {
    expect(HOMEPAGE_FEATURE_SLOTS).toEqual([
      "feature_1",
      "feature_2",
      "feature_3",
      "feature_4",
      "feature_5",
      "feature_6",
    ]);
  });
});

describe("buildHomepageSlotMap", () => {
  it("maps explicit slots to posts and ignores null / empty slots", () => {
    const posts = [
      row("1", "Main", "main-slug", "main_feature"),
      row("2", "F1", "f1", "feature_1"),
      row("3", "Loose", "loose", null),
      row("4", "Blank", "blank", ""),
    ];
    const map = buildHomepageSlotMap(posts);
    expect(map.get("main_feature")?.id).toBe("1");
    expect(map.get("feature_1")?.id).toBe("2");
    expect(map.has("feature_2")).toBe(false);
    expect(map.size).toBe(2);
  });

  it("trims slot strings", () => {
    const posts = [row("1", "T", "s", "  feature_3  ")];
    const map = buildHomepageSlotMap(posts);
    expect(map.get("feature_3")?.id).toBe("1");
  });
});

describe("placementFromSlotMap", () => {
  it("places main_feature and each feature_i in fixed indices without shifting", () => {
    const main = row("m", "Lead", "lead", "main_feature");
    const f1 = row("a", "A", "a", "feature_1");
    const f4 = row("d", "D", "d", "feature_4");
    const map = buildHomepageSlotMap([main, f1, f4]);

    const placement = placementFromSlotMap(map);
    expect(placement.main?.id).toBe("m");

    expect(placement.secondary[0]?.id).toBe("a");
    expect(placement.secondary[1]).toBeNull();
    expect(placement.secondary[2]).toBeNull();
    expect(placement.secondary[3]?.id).toBe("d");
    expect(placement.secondary[4]).toBeNull();
    expect(placement.secondary[5]).toBeNull();

    // feature_4 must not appear in the feature_1 index
    expect(placement.secondary[0]?.homepage_slot).toBe("feature_1");
    expect(placement.secondary[3]?.homepage_slot).toBe("feature_4");
  });

  it("does not infer posts from unslotted rows — map only contains assigned keys", () => {
    const onlyLatest = row("u", "Unslotted", "unslotted", null);
    const map = buildHomepageSlotMap([onlyLatest]);
    const placement = placementFromSlotMap(map);
    expect(placement.main).toBeNull();
    expect(placement.secondary.every((s) => s === null)).toBe(true);
  });
});

describe("Latest vs featured separation (contract)", () => {
  it("documents that unslotted published posts never receive a map entry", () => {
    const unslotted = row("x", "X", "x-slug", null);
    const map = buildHomepageSlotMap([unslotted]);
    expect(map.size).toBe(0);
    const placement = placementFromSlotMap(map);
    expect(placement.main).toBeNull();
  });
});
