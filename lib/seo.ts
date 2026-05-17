import { getEditorialSectionParts } from "@/lib/articles/article-body-model";
import { looksLikeHtml, richHtmlToPlainText } from "@/lib/content/sanitize-rich-html";
import type { PostRow } from "@/lib/database.types";
import { postImagePublicUrl } from "@/lib/posts/image-url";
import type { Metadata } from "next";

/** Canonical production origin (www). */
export const SITE_URL = "https://www.geekmyinterest.com";

export const SITE_NAME = "Geek My Interest";

export const DEFAULT_TITLE =
  "Geek My Interest | Anime, Gaming, Movies, Shows & Geek Culture";

export const DEFAULT_DESCRIPTION =
  "Geek My Interest covers anime, gaming, movies, shows, comics, tech, reviews, rankings, hot takes, and fan-first geek culture news.";

/** Fallback OG/Twitter image when a page has no dedicated image. */
export const DEFAULT_OG_IMAGE_PATH = "/icon.png";

/** Set in root layout when configured; omit from metadata if undefined. */
export const TWITTER_SITE = "@geekmyinterest";

const DESCRIPTION_MAX = 160;

export function getAbsoluteUrl(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return new URL(path, SITE_URL).toString();
}

export function buildCanonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

/** Strip HTML/markdown-ish noise and collapse whitespace. */
export function cleanDescription(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

export function truncateDescription(text: string, maxLength = DESCRIPTION_MAX): string {
  const cleaned = cleanDescription(text);
  if (cleaned.length <= maxLength) return cleaned;
  const slice = cleaned.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

type ArticleImageSource = {
  card_image?: string | null;
  cardImage?: string | null;
  card_image_url?: string | null;
  featured_image?: string | null;
  featuredImage?: string | null;
  image?: string | null;
  coverImage?: string | null;
};

/** Storage path or URL for the card image field (same source as homepage cards). */
export function getArticleCardImagePath(article: ArticleImageSource): string | null {
  const candidates = [
    article.card_image,
    article.cardImage,
    article.card_image_url,
    article.featured_image,
    article.featuredImage,
    article.image,
    article.coverImage,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

export async function resolveArticleSeoImageUrl(article: PostRow): Promise<string> {
  const path = getArticleCardImagePath(article);
  if (path) {
    const publicUrl = await postImagePublicUrl(path);
    if (publicUrl) return publicUrl;
  }
  return getAbsoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

function plainFromMaybeHtml(text: string): string {
  return cleanDescription(
    looksLikeHtml(text) ? richHtmlToPlainText(text) : text,
  );
}

/** Meta description from excerpt, then first body text, then title fallback. */
export function articleMetaDescription(post: PostRow): string {
  const excerpt = post.excerpt?.trim();
  if (excerpt) return truncateDescription(excerpt);

  const blocks = post.content_blocks;
  if (Array.isArray(blocks)) {
    for (const block of blocks) {
      if (!block || typeof block !== "object") continue;
      const o = block as Record<string, unknown>;
      if (o.type !== "text") continue;
      const data = o.data;
      if (!data || typeof data !== "object") continue;
      const html = (data as Record<string, unknown>).html;
      if (typeof html === "string" && html.trim()) {
        const plain = plainFromMaybeHtml(html);
        if (plain) return truncateDescription(plain);
      }
    }
  }

  const parts = getEditorialSectionParts(post as Record<string, unknown>);
  for (const part of parts) {
    if (part.kind === "text") {
      const plain = plainFromMaybeHtml(part.text);
      if (plain) return truncateDescription(plain);
    }
  }

  for (const key of ["body_part_1", "body_part_2"] as const) {
    const body = post[key];
    if (typeof body === "string" && body.trim()) {
      const plain = plainFromMaybeHtml(body);
      if (plain) return truncateDescription(plain);
    }
  }

  return truncateDescription(`${post.title} — ${SITE_NAME}`);
}

export function ogImageEntry(
  url: string,
  alt: string,
): NonNullable<Metadata["openGraph"]>["images"] {
  return [{ url, width: 1200, height: 630, alt }];
}

type PageMetadataInput = {
  title: string;
  /** When true, `title` is used as-is (skips root layout title template). */
  absoluteTitle?: boolean;
  description: string;
  canonicalPath: string;
  ogType?: "website" | "article";
  ogImageUrl: string;
  ogImageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = buildCanonicalUrl(input.canonicalPath);
  const images = ogImageEntry(input.ogImageUrl, input.ogImageAlt ?? SITE_NAME);
  const title = input.absoluteTitle
    ? { absolute: input.title }
    : input.title;

  return {
    title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      type: input.ogType ?? "website",
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      url: canonical,
      images,
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
      ...(input.authors?.length ? { authors: input.authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [input.ogImageUrl],
    },
  };
}

export function buildHomeMetadata(options: {
  title?: string;
  description?: string;
  canonicalPath?: string;
}): Metadata {
  const title = options.title ?? DEFAULT_TITLE;
  const description = options.description ?? DEFAULT_DESCRIPTION;
  const canonicalPath = options.canonicalPath ?? "/";
  return buildPageMetadata({
    title,
    description,
    canonicalPath,
    absoluteTitle: true,
    ogType: "website",
    ogImageUrl: getAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
    ogImageAlt: SITE_NAME,
  });
}
