import type { MetadataRoute } from "next";
import { CATEGORY_SLUGS } from "@/lib/posts/categories";
import { SITE_URL } from "@/lib/seo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const siteUrl = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createSupabaseServerClient();

  const [{ data: posts }, { data: tags }] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, published_at, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    supabase.from("tags").select("slug, created_at"),
  ]);

  const articleEntries: MetadataRoute.Sitemap = (posts ?? []).map(
    (p: { slug: string; published_at: string | null; created_at: string }) => ({
      url: `${siteUrl}/articles/${p.slug}`,
      lastModified: new Date(p.published_at ?? p.created_at),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  const tagEntries: MetadataRoute.Sitemap = (tags ?? []).map(
    (t: { slug: string; created_at: string }) => ({
      url: `${siteUrl}/tag/${t.slug}`,
      lastModified: new Date(t.created_at),
      changeFrequency: "weekly",
      priority: 0.5,
    }),
  );

  const categoryEntries: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${siteUrl}/category/${slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/podcast`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contact`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...categoryEntries,
    ...articleEntries,
    ...tagEntries,
  ];
}
