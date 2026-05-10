# Technical SEO Fixes

---

## 1. `metadataBase` — Root Layout

**Problem:** Without `metadataBase`, any relative URL in an `openGraph.images` array (e.g., `"/images/podtrans.png"`) cannot be resolved to an absolute URL by crawlers or social platforms. Next.js will warn in dev and produce broken `og:image` values in production.

**Fix:** In `app/layout.tsx`:
```ts
metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://geekmyinterest.com"),
```

This resolves all relative OG image paths globally.

---

## 2. Canonical URLs

**Problem:** No page has `alternates.canonical`. Google may choose the wrong canonical when the same content is accessible via multiple query-param variants (e.g., `/articles/foo?utm_source=...`).

**Fix:** Add `alternates: { canonical: fullUrl }` to every indexable page's `generateMetadata` / `metadata` export. Use `NEXT_PUBLIC_SITE_URL` for the base.

---

## 3. `robots.txt` via `app/robots.ts`

**Problem:** No `robots.txt` exists. Crawlers will crawl all routes including `/admin/`, `/api/`, and auth pages.

**Fix:** Create `app/robots.ts`:
```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/login", "/signup",
                   "/complete-profile", "/update-password", "/forgot-password"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

---

## 4. `sitemap.xml` via `app/sitemap.ts`

**Problem:** No sitemap exists. Google must crawl the full site to discover all articles and tag pages.

**Fix:** Create `app/sitemap.ts` that fetches:
- All published posts → `/articles/[slug]`
- All tags → `/tag/[slug]`
- Static pages: `/`, `/podcast`, `/contact`
- Category pages: `/category/movies`, `/category/anime`, `/category/shows`, `/category/games`, `/category/tech`

Use `lastModified` from `updated_at` or `published_at` where available.

---

## 5. Noindex on Utility Pages

**Problem:** Auth and search pages have no `robots` metadata. Search result pages (`/search?q=...`) would be indexed as thin content with little value.

**Fix:** Add `robots: { index: false, follow: false }` to all auth pages and `/search`.

---

## 6. Hero Image Alt Text

**Problem:** `app/articles/[slug]/page.tsx` line 77 — `alt=""` on the hero `<Image>`. Empty alt text is an accessibility violation and a missed keyword opportunity for image search.

**Fix:** `alt={post.title}`

---

## 7. Search API Caching

**Problem:** `GET /api/search?q=...` runs 4–5 parallel Supabase queries with no caching. At moderate traffic this saturates the DB connection pool. Identical queries get no benefit.

**Fix:** Add `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` to success responses. Vercel Edge Cache and CDNs will cache identical query strings.

---

## 8. Open Graph Images — Absolute URLs

All OG images must be absolute (with domain). With `metadataBase` set, relative paths like `"/images/podtrans.png"` are resolved automatically.

For article-specific OG images, the Supabase storage `getPublicUrl()` already returns an absolute URL, so no change is needed there.

---

## Summary of Files Changed

| File | Change |
|------|--------|
| `app/layout.tsx` | Add `metadataBase`, default OG/Twitter |
| `app/page.tsx` | Add `metadata` export |
| `app/articles/[slug]/page.tsx` | Full `generateMetadata`, fix `alt=""` |
| `app/authors/[username]/page.tsx` | Add description, canonical, OG |
| `app/tag/[slug]/page.tsx` | Add OG, Twitter, canonical |
| `app/podcast/page.tsx` | Add OG image, Twitter card |
| `app/contact/page.tsx` | Add OG, canonical |
| `app/search/page.tsx` | Add noindex |
| `app/login/page.tsx` | Add noindex |
| `app/signup/page.tsx` | Add noindex |
| `app/forgot-password/page.tsx` | Add noindex |
| `app/update-password/page.tsx` | Add noindex |
| `app/complete-profile/page.tsx` | Add noindex |
| `app/api/search/route.ts` | Add Cache-Control header |
| `app/robots.ts` | New file |
| `app/sitemap.ts` | New file |
| `app/category/[slug]/page.tsx` | New file |
| `components/articles/RelatedArticles.tsx` | New file |
| `lib/posts/queries.ts` | Add `fetchPublishedPostsByCategory`, `fetchRelatedPosts` |
