import {
  getEditorialSectionParts,
  getLegacyArticleParts,
} from "@/lib/articles/article-body-model";
import { postHasEditorialSections } from "@/lib/posts/section-fields";
import { render, screen } from "@testing-library/react";

describe("getEditorialSectionParts", () => {
  it("emits text then image then video within a section, in section index order", () => {
    const post = {
      section_1_text: "First block",
      section_1_image: "path/one.png",
      section_1_video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      section_3_text: "Third only",
    };
    const parts = getEditorialSectionParts(post);
    expect(parts.map((p) => `${p.kind}:${p.section}`)).toEqual([
      "text:1",
      "image:1",
      "video:1",
      "text:3",
    ]);
    expect(parts[0]).toMatchObject({ kind: "text", text: "First block" });
    expect(parts[1]).toMatchObject({ kind: "image", storagePath: "path/one.png" });
    expect(parts[2]).toMatchObject({
      kind: "video",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });

  it("skips sections that are completely empty", () => {
    const post = {
      section_2_text: "   ",
      section_2_image: "",
      section_5_text: "Keep",
    };
    const parts = getEditorialSectionParts(post);
    expect(parts.map((p) => p.section)).toEqual([5]);
  });

  it("allows image-only sections", () => {
    const post = { section_4_image: "solo.jpg" };
    expect(getEditorialSectionParts(post)).toEqual([
      { kind: "image", section: 4, storagePath: "solo.jpg" },
    ]);
  });

  it("allows video-only sections", () => {
    const post = { section_6_video_url: "https://www.tiktok.com/@x/video/1" };
    expect(getEditorialSectionParts(post)).toEqual([
      { kind: "video", section: 6, url: "https://www.tiktok.com/@x/video/1" },
    ]);
  });
});

describe("getLegacyArticleParts", () => {
  it("returns body1, inline, body2 in fixed order, omitting missing pieces", () => {
    const post = {
      body_part_1: "Intro",
      inline_image: "inline.png",
      body_part_2: "Outro",
    };
    expect(getLegacyArticleParts(post).map((p) => p.kind)).toEqual([
      "body1",
      "inline_image",
      "body2",
    ]);
  });

  it("handles older posts with only body_part_1", () => {
    const post = { body_part_1: "Solo legacy body" };
    expect(getLegacyArticleParts(post)).toEqual([
      { kind: "body1", text: "Solo legacy body" },
    ]);
  });
});

describe("postHasEditorialSections", () => {
  it("is false when no section columns are populated", () => {
    expect(postHasEditorialSections({ title: "x" })).toBe(false);
  });

  it("is true when any section text, image, or video URL exists", () => {
    expect(postHasEditorialSections({ section_9_text: "Hi" })).toBe(true);
    expect(postHasEditorialSections({ section_2_image: "z" })).toBe(true);
    expect(postHasEditorialSections({ section_5_video_url: "https://x.com/i/status/1" })).toBe(
      true,
    );
  });
});

describe("Article section UI smoke (ordering)", () => {
  it("renders editorial parts in the order returned by getEditorialSectionParts", () => {
    function Preview({ post }: { post: Record<string, unknown> }) {
      const parts = getEditorialSectionParts(post);
      return (
        <ol>
          {parts.map((p, i) => (
            <li key={i}>
              {p.kind === "text" ? p.text : p.kind === "image" ? p.storagePath : p.url}
            </li>
          ))}
        </ol>
      );
    }

    render(
      <Preview
        post={{
          section_1_text: "Alpha",
          section_2_text: "Beta",
          section_2_image: "b.png",
        }}
      />,
    );

    const items = screen.getAllByRole("listitem").map((el) => el.textContent);
    expect(items).toEqual(["Alpha", "Beta", "b.png"]);
  });
});
