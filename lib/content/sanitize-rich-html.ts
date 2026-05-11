import sanitizeHtml from "sanitize-html";

export function looksLikeHtml(input: string | null | undefined): boolean {
  const raw = (input ?? "").trim();
  return /<[a-z][\s\S]*>/i.test(raw);
}

export function sanitizeRichHtml(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "span",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      h5: ["style"],
      h6: ["style"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\((\s*\d+\s*,){2}\s*\d+\s*\)$/],
        "font-size": [/^\d+(?:px|rem|em|%)$/],
        "text-align": [/^(left|right|center|justify)$/],
      },
    },
  });
}

export function richHtmlToPlainText(input: string): string {
  const sanitized = sanitizeRichHtml(input);
  return sanitizeHtml(sanitized, { allowedTags: [], allowedAttributes: {} }).trim();
}
