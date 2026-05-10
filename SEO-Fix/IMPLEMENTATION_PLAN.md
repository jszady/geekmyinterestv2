# Implementation Plan

Ordered by impact. All changes implemented in the codebase.

---

## Step 1 — Foundation (Highest Impact)

### 1a. `app/layout.tsx` — Add `metadataBase`
Required for all relative OG image paths to work. One line change.

### 1b. `app/robots.ts` — Create robots.txt
Prevents crawlers from indexing admin, API, and auth routes.

### 1c. `app/sitemap.ts` — Create sitemap
Submits all indexable URLs to Google. Fetches published posts and all tags from Supabase at build/request time.

---

## Step 2 — Article Pages (High Value)

### 2a. `app/articles/[slug]/page.tsx` — Full `generateMetadata`
- Add `description` from `post.excerpt`
- Add `alternates.canonical`
- Add `openGraph` with `og:image` from storage
- Add `twitter.card: "summary_large_image"`

### 2b. Fix `alt=""` on hero image
Change empty alt to `alt={post.title}`.

### 2c. Add Related Articles section
New `components/articles/RelatedArticles.tsx` server component rendered below comments.

---

## Step 3 — New Query Functions (`lib/posts/queries.ts`)

### 3a. `fetchPublishedPostsByCategory(category, limit?)`
Used by category archive pages.

### 3b. `fetchRelatedPosts(postId, tagIds, category, limit?)`
Used by RelatedArticles component. Tag-first, category fallback.

---

## Step 4 — New Category Archive Pages

### 4a. `app/category/[slug]/page.tsx`
Five category archives for Movie/Anime/Show/Game/Tech.
- `generateStaticParams` returns all 5 slugs
- `generateMetadata` returns full metadata
- Renders a PostCard grid

---

## Step 5 — Remaining Page Metadata

### 5a. Homepage
Add `metadata` export with OG and Twitter.

### 5b. Author pages
Add description, canonical, OG.

### 5c. Tag pages
Add OG, Twitter, canonical.

### 5d. Podcast page
Add OG image (`/images/podtrans.png`), Twitter card.

### 5e. Contact page
Add OG, canonical.

---

## Step 6 — Noindex Utility Pages

Add `robots: { index: false, follow: false }` to:
- `/login`
- `/signup`
- `/forgot-password`
- `/update-password`
- `/complete-profile`
- `/search`

---

## Step 7 — API Caching

Add `Cache-Control: public, s-maxage=30, stale-while-revalidate=60` to `app/api/search/route.ts`.

---

## Verification Checklist

After implementation:

- [ ] View source of homepage — confirm `<meta property="og:title">` present
- [ ] View source of an article — confirm `<meta property="og:image">` has absolute URL
- [ ] `curl https://geekmyinterest.com/robots.txt` — confirm admin/api are disallowed
- [ ] `curl https://geekmyinterest.com/sitemap.xml` — confirm article URLs listed
- [ ] Check `/login` page source — confirm `<meta name="robots" content="noindex">`
- [ ] Visit `/category/movies` — confirm it renders
- [ ] Visit an article — confirm Related Articles section appears (if tags exist)
- [ ] Google Rich Results Test — paste any article URL, check OG fields
