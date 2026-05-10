import type { ReactNode } from "react";
import { renderSectionTextWithMarkdown } from "@/lib/posts/section-text-markdown";
import { renderToStaticMarkup } from "react-dom/server";

jest.mock("next/link", () => ({
  __esModule: true,
  default({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} data-next-link="1" className={className}>
        {children}
      </a>
    );
  },
}));

function markup(node: ReturnType<typeof renderSectionTextWithMarkdown>) {
  return renderToStaticMarkup(<span>{node}</span>);
}

describe("renderSectionTextWithMarkdown", () => {
  it("leaves plain text escaped and unchanged aside from escaping", () => {
    const html = markup(renderSectionTextWithMarkdown("Hello & <world>"));
    expect(html).toContain("Hello &amp; &lt;world&gt;");
    expect(html).not.toContain("<a ");
  });

  it("renders internal paths as links", () => {
    const html = markup(
      renderSectionTextWithMarkdown("See [this](/articles/foo) now."),
    );
    expect(html).toContain('href="/articles/foo"');
    expect(html).toContain("data-next-link");
    expect(html).toContain("this");
  });

  it("renders https links with target blank", () => {
    const html = markup(
      renderSectionTextWithMarkdown("[x](https://example.com/path)"),
    );
    expect(html).toContain('href="https://example.com/path"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("rejects protocol-relative and leaves literal", () => {
    const html = markup(renderSectionTextWithMarkdown("[bad](//evil.com)"));
    expect(html).not.toContain("href=");
    expect(html).toContain("[bad](//evil.com)");
  });

  it("rejects javascript href (no anchor, literal shown)", () => {
    const html = markup(renderSectionTextWithMarkdown("[x](javascript:alert(1))"));
    expect(html).not.toMatch(/<a\s[^>]*href=/);
    expect(html).toContain("[x](javascript:alert(1))");
  });
});
