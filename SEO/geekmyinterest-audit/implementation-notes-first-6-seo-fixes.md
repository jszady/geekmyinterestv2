# Implementation notes — first 6 technical SEO fixes

## 1. Summary of changes

Implemented the six high-priority audit items without changing routes, layout, or article URLs:

1. **Global metadata** — `metadataBase` set to `https://www.geekmyinterest.com` with site-wide default title, description, Open Graph, and Twitter fallbacks in `app/layout.tsx`.
2. **Meta descriptions** — Unique descriptions per page type via `lib/seo.ts` (`articleMetaDescription`, category copy in `lib/posts/categories.ts`, existing podcast/contact copy).
3. **Open Graph** — `buildPageMetadata()` adds `og:type`, `siteName`, title, description, url, and 1200×630 images on homepage, categories, articles, authors, podcast, and contact.
4. **Twitter cards** — `summary_large_image` on the same pages; uses `@geekmyinterest` from root layout (`TWITTER_SITE` in `lib/seo.ts`).
5. **Canonical URLs** — All updated pages use `https://www.geekmyinterest.com` via `buildCanonicalUrl()`.
6. **JSON-LD** — `components/seo/JsonLd.tsx` + `lib/schema.ts` for WebSite/Organization (home), BlogPosting + BreadcrumbList (articles), BreadcrumbList (categories), Person (authors).
7. **Domain consistency** — Production default in `lib/site-public-url.ts`, `app/sitemap.ts`, and `app/robots.ts` now use **www** (`SITE_URL`).

## 2. Files changed

| File | Change |
|------|--------|
| `lib/seo.ts` | **New** — SITE_URL, descriptions, `buildPageMetadata`, article image/description helpers |
| `lib/schema.ts` | **New** — JSON-LD builders |
| `components/seo/JsonLd.tsx` | **New** — Renders JSON-LD script tags |
| `lib/site-public-url.ts` | Production default → `https://www.geekmyinterest.com` |
| `lib/posts/categories.ts` | Full `CATEGORY_SEO` for all six categories |
| `app/layout.tsx` | `metadataBase`, global OG/Twitter defaults |
| `app/page.tsx` | Homepage metadata + WebSite/Organization JSON-LD |
| `app/articles/[slug]/page.tsx` | Card-image OG/Twitter, descriptions, Article JSON-LD |
| `app/category/[slug]/page.tsx` | Category SEO metadata + BreadcrumbList JSON-LD |
| `app/authors/[username]/page.tsx` | Canonical/OG/Twitter + Person JSON-LD |
| `app/podcast/page.tsx` | Metadata via `buildPageMetadata` (www URLs) |
| `app/contact/page.tsx` | Metadata via `buildPageMetadata` |
| `app/sitemap.ts` | Uses `SITE_URL` (www) |
| `app/robots.ts` | Sitemap URL uses `SITE_URL` (www) |
| `.env.example` | Production URL comment → www |

## 3. Article image field for OG / Twitter

**Primary field:** `posts.card_image` (storage path in Supabase `post-images` bucket).

Resolved with `postImagePublicUrl()` — same helper used for homepage/category **card** thumbnails in `lib/posts/map-row-to-card.ts` (`card_image` only).

`getArticleCardImagePath()` also accepts common aliases (`cardImage`, `featured_image`, etc.) if ever added; only `card_image` exists on `PostRow` today.

**Not used for OG:** `hero_image` (article page hero only; previously used for OG — **removed** per audit).

**Fallback:** `/icon.png` → `https://www.geekmyinterest.com/icon.png`

## 4. Missing fields / fallbacks

| Field | Fallback |
|-------|----------|
| `excerpt` | First text from `content_blocks`, editorial `section_*_text`, or `body_part_1` / `body_part_2` (HTML stripped) |
| `updated_at` | `published_at` or `created_at` for `dateModified` |
| Author name | Omitted from OG `authors` if profile has no username |
| `card_image` | Site icon (`/icon.png`) |
| Category OG image | Site icon (no per-category artwork yet) |

## 5. Pages to verify manually

- [ ] `https://www.geekmyinterest.com/` — view-source: canonical, OG, Twitter, WebSite + Organization JSON-LD
- [ ] `https://www.geekmyinterest.com/category/comics` (and anime, movies, etc.)
- [ ] Published article with **card_image** — OG/Twitter image should match card thumbnail
- [ ] Published article **without** card_image — fallback icon
- [ ] `https://www.geekmyinterest.com/authors/{username}`
- [ ] `https://www.geekmyinterest.com/podcast`
- [ ] `https://www.geekmyinterest.com/sitemap.xml` — all URLs use **www**
- [ ] `https://www.geekmyinterest.com/robots.txt` — `Sitemap: https://www.geekmyinterest.com/sitemap.xml`
- [ ] Facebook Sharing Debugger / Twitter Card Validator for a sample article

**Not updated in this pass (still have basic metadata):** `/tag/[slug]`, `/search` — planned for a later SEO task.

## 6. Risks / TODOs

- Set **`NEXT_PUBLIC_SITE_URL=https://www.geekmyinterest.com`** in production (Vercel/hosting). If env stays non-www, `getPublicSiteUrl()` could still diverge from `SITE_URL` in sitemap/robots until env is fixed.
- Confirm **`/icon.png`** is acceptable as the global OG image; replace with a dedicated 1200×630 asset later if desired.
- Article **title template** adds `| Geek My Interest` for article pages only; category/home use `absoluteTitle` to avoid double suffixes.
- No **hreflang** or **non-www → www** redirect in this change set (hosting/DNS level).

## 7. SQL required?

**No.** SEO is metadata-only; `posts.category` and existing columns are unchanged.

## 8. Build / lint

Run locally:

```bash
npm run lint
npm run build
```

(Requires Node ≥ 20 for Next.js 16.)
