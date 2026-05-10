# Improvements: What to Fix, Why It Matters, and How

Each item references the exact file and the minimum change required. Items are ordered by impact-to-effort ratio.

---

## Priority 1 — Can Be Done in One Sitting (Highest Impact, Lowest Effort)

---

### FIX 1: Add meta description to article pages using `post.excerpt`

**Problem:** `generateMetadata` in `app/articles/[slug]/page.tsx` only returns `{ title }`. Every article has no meta description in search results.

**Why it matters:** Google uses the description tag for the snippet shown in search results. Without it, Google generates one automatically — usually a mid-sentence fragment. Click-through rates on articles with a real description are significantly higher.

**Exact fix:**
```typescript
// app/articles/[slug]/page.tsx
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await fetchPublishedPostBySlug(slug);
  if (!post) return { title: "Article — Geek My Interest" };
  return {
    title: `${post.title} — Geek My Interest`,
    description: post.excerpt ?? undefined,
  };
}
```

`post.excerpt` already exists in the PostRow schema (`lib/database.types.ts` line 68). This is one line of code.

---

### FIX 2: Add Open Graph + Twitter Card to article `generateMetadata`

**Problem:** Zero social sharing cards on any article. Every share on X/Discord/Reddit shows a plain link.

**Why it matters:** Social sharing is a primary traffic driver for media sites. An article shared to a Discord server of 5,000 people with a card image gets 10–30x more clicks than a plain link.

**Exact fix:**
```typescript
// app/articles/[slug]/page.tsx
export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await fetchPublishedPostBySlug(slug);
  if (!post) return { title: "Article — Geek My Interest" };

  const imageUrl = await postImagePublicUrl(post.hero_image ?? post.card_image);

  return {
    title: `${post.title} — Geek My Interest`,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.published_at ?? post.created_at,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}
```

`postImagePublicUrl` is already imported in the page file.

---

### FIX 3: Add Open Graph to homepage

**Problem:** `app/page.tsx` has no metadata export at all.

**Why it matters:** The homepage is the most linked page on the site and the most commonly shared URL. When someone shares the homepage, it appears with no image and no description.

**Exact fix:**
```typescript
// app/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Geek My Interest | Movies, Anime, Games & Tech",
  description:
    "Hot takes, deep dives, and everything nerd culture — movies, anime, games, shows, and tech from people who actually watch and play.",
  openGraph: {
    title: "Geek My Interest",
    description:
      "Hot takes, deep dives, and everything nerd culture — movies, anime, games, shows, and tech.",
    type: "website",
    images: [{ url: "/images/og-default.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Geek My Interest",
    description: "Hot takes, deep dives, and everything nerd culture.",
  },
};
```

Also create a default OG image at `public/images/og-default.png` (1200×630px, branded).

---

### FIX 4: Mark auth and utility pages as noindex

**Problem:** `/login`, `/signup`, `/forgot-password`, `/update-password`, `/complete-profile` have no robots directives.

**Why it matters:** Crawl budget is finite. Google spending crawl budget on auth pages means it has less to spend on articles and tag pages.

**Exact fix:** Add to each auth page file:
```typescript
// app/login/page.tsx
export const metadata: Metadata = {
  title: "Log in — Geek My Interest",
  robots: { index: false, follow: false },
};
```

Apply the same `robots: { index: false, follow: false }` to: `app/signup/page.tsx`, `app/forgot-password/page.tsx`, `app/update-password/page.tsx`, `app/complete-profile/page.tsx`.

---

### FIX 5: Mark the search page as noindex

**Problem:** `/search?q=something` can be indexed as a thin-content page.

**Why it matters:** A site with hundreds of indexed search result URLs sends a low-quality signal to Google. Google treats these as doorway/thin-content pages.

**Exact fix:**
```typescript
// app/search/page.tsx — add to generateMetadata
return {
  title: `${title} — Geek My Interest`,
  robots: { index: false, follow: true },
};
```

---

### FIX 6: Fix the empty alt text on the article hero image

**Problem:** `app/articles/[slug]/page.tsx` line 77: `alt=""`.

**Why it matters:** Google Image Search uses alt text to understand what an image depicts. An empty alt means the hero image of every article is invisible to Google Images. It also fails WCAG accessibility standards.

**Exact fix:**
```typescript
// app/articles/[slug]/page.tsx line 77
<Image src={heroUrl} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 720px" priority />
```

Using `post.title` as the alt is standard for article hero images — it describes what the image represents.

---

## Priority 2 — High Impact, Moderate Effort (1–2 days)

---

### FIX 7: Create `app/robots.ts`

**Problem:** No robots.txt exists. Admin routes, API routes, and auth routes are all crawlable.

**Exact fix — create `app/robots.ts`:**
```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://geekmyinterest.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/complete-profile/", "/update-password/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
```

---

### FIX 8: Create `app/sitemap.ts`

**Problem:** No sitemap. Google must discover every article by following links from the homepage.

**Exact fix — create `app/sitemap.ts`:**
```typescript
import type { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://geekmyinterest.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createSupabaseServerClient();

  const [postsRes, tagsRes] = await Promise.all([
    supabase.from("posts").select("slug, published_at, updated_at").eq("status", "published"),
    supabase.from("tags").select("slug"),
  ]);

  const posts: MetadataRoute.Sitemap = (postsRes.data ?? []).map((p) => ({
    url: `${BASE}/articles/${p.slug}`,
    lastModified: p.published_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const tags: MetadataRoute.Sitemap = (tagsRes.data ?? []).map((t) => ({
    url: `${BASE}/tag/${t.slug}`,
    changeFrequency: "daily",
    priority: 0.5,
  }));

  const statics: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/podcast`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];

  return [...statics, ...posts, ...tags];
}
```

Also add `NEXT_PUBLIC_SITE_URL=https://geekmyinterest.com` to your production environment variables.

---

### FIX 9: Add `NewsArticle` JSON-LD schema to article pages

**Problem:** No structured data. Articles cannot appear as rich results or in Top Stories.

**Why it matters:** The Google Top Stories carousel (shown in mobile search results for news queries) requires `NewsArticle` schema with `datePublished`. This can be the single largest traffic driver for a media site — top stories positions receive 3–5x the click-through rate of regular organic results.

**Exact fix — add to `app/articles/[slug]/page.tsx` inside the `<article>` element:**
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: post.title,
      description: post.excerpt ?? undefined,
      datePublished: post.published_at ?? post.created_at,
      dateModified: post.updated_at ?? post.published_at ?? post.created_at,
      author: {
        "@type": "Person",
        name: authorUsername ?? "Geek My Interest",
        url: authorHref ? `${BASE}${authorHref}` : undefined,
      },
      publisher: {
        "@type": "Organization",
        name: "Geek My Interest",
        logo: { "@type": "ImageObject", url: `${BASE}/images/logo/logo.png` },
      },
      image: heroUrl ?? undefined,
      mainEntityOfPage: `${BASE}/articles/${post.slug}`,
    }),
  }}
/>
```

---

### FIX 10: Add canonical URLs to all dynamic routes

**Problem:** No `alternates.canonical` anywhere. Tag pages with mixed-case slugs could be indexed as duplicates.

**Exact fix:** Add to `generateMetadata` in article, tag, and author pages:
```typescript
// app/articles/[slug]/page.tsx
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://geekmyinterest.com";
return {
  // ...existing fields...
  alternates: {
    canonical: `${BASE}/articles/${slug}`,
  },
};
```

Apply the same pattern to `app/tag/[slug]/page.tsx` and `app/authors/[username]/page.tsx`.

---

### FIX 11: Add category archive pages

**Problem:** There is no `/category/anime`, `/category/movies`, etc. The `PostCategoryDb` enum has five values but no archive pages.

**Why it matters:** Category pages are some of the highest-value SEO targets on a media site. `/category/anime` can rank for "best anime articles" and "anime news" — high-intent, high-volume queries that individual article pages cannot rank for.

**Exact fix:** Create `app/category/[slug]/page.tsx` mirroring the structure of `app/tag/[slug]/page.tsx`, but filtering by `post.category`. Add category links to the Navbar and a site-wide category navigation strip.

---

### FIX 12: Add description to author page metadata

**Problem:** Author `generateMetadata` returns only title.

**Exact fix:**
```typescript
// app/authors/[username]/page.tsx
return {
  title: `${name} — Authors — Geek My Interest`,
  description: `Read all articles by ${name} on Geek My Interest — movies, anime, gaming, and tech.`,
  alternates: { canonical: `${BASE}/authors/${encodeURIComponent(decoded)}` },
};
```

---

## Priority 3 — Medium Impact, Planned Work (Phased Implementation)

---

### FIX 13: Add Organization JSON-LD to root layout

**Problem:** No schema in `app/layout.tsx`. The site has no Knowledge Panel presence.

**Exact fix:** Add to `app/layout.tsx` inside the `<body>`:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Geek My Interest",
      url: "https://geekmyinterest.com",
      logo: "https://geekmyinterest.com/images/logo/logo.png",
      sameAs: [
        "https://www.youtube.com/@geekmyinterest",
        "https://open.spotify.com/show/...",
        "https://twitter.com/geekmyinterest",
      ],
    }),
  }}
/>
```

---

### FIX 14: Add related articles section to article pages

**Problem:** Article pages have no next-step content. Reader exits at the bottom.

**Exact fix:** Create `components/articles/RelatedArticles.tsx`. In `app/articles/[slug]/page.tsx`, after `fetchTagsForPostId`, query for other published posts sharing the same tags or category, limit 3. Render above the comments section.

```typescript
// lib/posts/queries.ts — add new function
export async function fetchRelatedPosts(slug: string, tagIds: string[], category: string, limit = 3) {
  // Query posts matching tag IDs or same category, exclude current slug, published only
}
```

---

### FIX 15: Create an RSS feed route

**Problem:** No `/feed.xml`. Aggregators, Google News, and power users cannot follow the site.

**Exact fix:** Create `app/feed.xml/route.ts`:
```typescript
import { fetchPublishedPostsLatest } from "@/lib/posts/queries";
export async function GET() {
  const posts = await fetchPublishedPostsLatest(50);
  const xml = buildRssFeed(posts); // generate RSS 2.0 XML
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml" } });
}
```

---

### FIX 16: Add `generateStaticParams` to article and tag routes

**Problem:** Articles are rendered on first request. Googlebot may hit a cold page.

**Exact fix:**
```typescript
// app/articles/[slug]/page.tsx
export async function generateStaticParams() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("posts").select("slug").eq("status", "published");
  return (data ?? []).map((p) => ({ slug: p.slug }));
}
```

Use with `export const revalidate = 3600` (re-check for new slugs hourly). The `revalidatePath` calls in admin actions will still immediately update individual pages.

---

### FIX 17: Add pagination to tag and author archive pages

**Problem:** All posts rendered on a single page; no page 2 to index.

**Exact fix:** Add `page` query param to `app/tag/[slug]/page.tsx`. Fetch 24 posts per page using Supabase `.range()`. Add pagination links (`/tag/anime?page=2`) with `rel="next"` and `rel="prev"` meta tags. Each paginated URL becomes its own indexable page with shallow content depth.

---

### FIX 18: Replace ILIKE search with Postgres full-text search

**Problem:** `lib/posts/search-published.ts` uses `ILIKE '%query%'` which causes a full table scan.

**Exact fix:** Add a `tsvector` column to the posts table using a Supabase migration:
```sql
ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
  ) STORED;

CREATE INDEX posts_search_idx ON posts USING GIN(search_vector);
```

Then in `lib/posts/search-published.ts`, replace ILIKE with:
```typescript
.textSearch("search_vector", query, { type: "websearch", config: "english" })
```

This will be 10–100x faster and support phrase search and relevance ranking.

---

### FIX 19: Add Open Graph to the podcast page

**Problem:** `app/podcast/page.tsx` has title + description but no OG or twitter metadata.

**Exact fix:**
```typescript
// app/podcast/page.tsx
export const metadata: Metadata = {
  title: "Podcast | Geek My Interest",
  description: "The Geek My Interest Podcast — hot takes, deep dives, and debates across movies, anime, gaming, and nerd culture.",
  openGraph: {
    title: "The Geek My Interest Podcast",
    description: "Hot takes, deep dives, and debates across movies, anime, gaming, and nerd culture.",
    type: "website",
    images: [{ url: "/images/podtrans.png", width: 1200, height: 1200 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Geek My Interest Podcast",
    description: "Hot takes, deep dives, and debates across nerd culture.",
    images: ["/images/podtrans.png"],
  },
};
```
