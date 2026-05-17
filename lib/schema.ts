import { SITE_NAME, SITE_URL, buildCanonicalUrl, getAbsoluteUrl } from "@/lib/seo";
import type { PostCategorySlug } from "@/lib/posts/categories";
import { CATEGORY_BY_SLUG } from "@/lib/posts/categories";

export type BreadcrumbItem = { name: string; url: string };

export function breadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Anime, gaming, movies, shows, comics, tech, reviews, rankings, and geek culture news.",
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: getAbsoluteUrl("/icon.png"),
  };
}

export function blogPostingSchema(input: {
  headline: string;
  description: string;
  imageUrl: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  authorUrl?: string;
  articleUrl: string;
  articleSection?: string;
}) {
  const author =
    input.authorName && input.authorUrl
      ? {
          "@type": "Person",
          name: input.authorName,
          url: input.authorUrl,
        }
      : input.authorName
        ? { "@type": "Person", name: input.authorName }
        : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description,
    image: [input.imageUrl],
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: getAbsoluteUrl("/icon.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.articleUrl,
    },
    ...(input.articleSection ? { articleSection: input.articleSection } : {}),
  };
}

export function personSchema(input: {
  name: string;
  url: string;
  description?: string;
  imageUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
  };
}

export function categoryBreadcrumbs(slug: PostCategorySlug) {
  const label = CATEGORY_BY_SLUG[slug].label;
  return breadcrumbListSchema([
    { name: "Home", url: SITE_URL },
    { name: label, url: buildCanonicalUrl(`/category/${slug}`) },
  ]);
}

export function articleBreadcrumbs(
  categorySlug: PostCategorySlug | null,
  categoryLabel: string,
  articleTitle: string,
  articlePath: string,
) {
  const items: BreadcrumbItem[] = [{ name: "Home", url: SITE_URL }];
  if (categorySlug) {
    items.push({
      name: categoryLabel,
      url: buildCanonicalUrl(`/category/${categorySlug}`),
    });
  }
  items.push({ name: articleTitle, url: buildCanonicalUrl(articlePath) });
  return breadcrumbListSchema(items);
}
