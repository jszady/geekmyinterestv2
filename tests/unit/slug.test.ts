import { resolveUniqueSlug, slugify } from "@/lib/posts/slug";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("slugify", () => {
  it("lowercases and trims the title", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("replaces spaces and punctuation with hyphens", () => {
    expect(slugify("Foo & Bar — Baz!!!")).toBe("foo-bar-baz");
  });

  it("strips curly apostrophes and collapses other punctuation into hyphens", () => {
    expect(slugify("It's a Test")).toBe("its-a-test");
  });

  it("returns 'post' for empty or whitespace-only input", () => {
    expect(slugify("")).toBe("post");
    expect(slugify("   ")).toBe("post");
  });

  it("truncates to 120 characters", () => {
    const long = "a".repeat(200);
    expect(slugify(long).length).toBe(120);
  });
});

function makeSlugLookupMock(
  slugToExistingId: Record<string, string | null>,
  excludePostId?: string,
): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: (_col: string, slug: string) => ({
          maybeSingle: async () => {
            const id = slugToExistingId[slug];
            if (!id) {
              return { data: null, error: null };
            }
            if (excludePostId && id === excludePostId) {
              return { data: null, error: null };
            }
            return { data: { id }, error: null };
          },
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("resolveUniqueSlug", () => {
  it("returns the base slug when unused", async () => {
    const supabase = makeSlugLookupMock({});
    await expect(resolveUniqueSlug(supabase, "my-article")).resolves.toBe(
      "my-article",
    );
  });

  it("appends -1, -2, … when slugs are taken", async () => {
    const supabase = makeSlugLookupMock({
      story: "p1",
      "story-1": "p2",
      "story-2": "p3",
    });
    await expect(resolveUniqueSlug(supabase, "story")).resolves.toBe("story-3");
  });

  it("allows the same slug when the only row is excluded (edit flow)", async () => {
    const supabase = makeSlugLookupMock({ keep: "post-abc" }, "post-abc");
    await expect(
      resolveUniqueSlug(supabase, "keep", "post-abc"),
    ).resolves.toBe("keep");
  });

  it("throws when Supabase returns an error", async () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    const bad: SupabaseClient = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: null,
              error: { message: "boom" },
            }),
          }),
        }),
      }),
    } as unknown as SupabaseClient;

    await expect(resolveUniqueSlug(bad, "x")).rejects.toThrow(/Slug check failed/);
    err.mockRestore();
  });
});
