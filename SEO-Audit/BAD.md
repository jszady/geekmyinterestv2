# Critical Issues, Gaps, and Risks

## Critical SEO Issues

### 1. Article pages have no meta description — the most important SEO field is missing
`app/articles/[slug]/page.tsx` `generateMetadata()` only returns `title`. No `description`, no `openGraph`, no `twitter`. Every article page will show a blank snippet in Google search results. The post schema already has an `excerpt: string | null` field that is populated by the admin CMS — it is simply never passed to the metadata.

The Google snippet for every article on this site will either be:
- empty (no snippet shown)
- auto-generated from the first paragraph of body text, which may start mid-sentence or with a section subheading

**File:** `app/articles/[slug]/page.tsx` lines 20–25

### 2. No Open Graph or Twitter Card metadata anywhere
Not a single page sets `openGraph` or `twitter` fields in its metadata object. When any article, podcast, or tag page is shared on X/Twitter, LinkedIn, Discord, Reddit, or Facebook, it renders as a plain text link with no image, no custom title, and no description. For a media site whose audience lives online and shares content constantly, this is a silent conversion killer.

The data is available: `post.hero_image`, `post.card_image`, `post.title`, `post.excerpt` are all in the schema. None of it reaches the `<meta property="og:image">` tag.

**Files:** All page files — `app/articles/[slug]/page.tsx`, `app/podcast/page.tsx`, `app/tag/[slug]/page.tsx`, `app/page.tsx`

### 3. No robots.txt — search engines have no crawl directives
There is no `app/robots.ts`, no `public/robots.txt`, and no robots config in `next.config.ts`. This means:
- `/admin/*` is crawlable by Googlebot (wasted crawl budget, possible CMS UI indexed)
- `/login`, `/signup`, `/forgot-password`, `/update-password`, `/complete-profile` are all crawlable and may be indexed
- `/auth/callback` is crawlable
- `/api/search` is crawlable
- There is no `Sitemap:` directive pointing to a sitemap

Without a robots.txt, Google's default behavior is to crawl everything. The crawler will spend crawl budget on pages that should never be indexed.

### 4. No sitemap — content discovery depends entirely on Google following links
There is no `app/sitemap.ts` and no `public/sitemap.xml`. Google must find all articles, tag pages, and author pages by crawling from the homepage. Pages that are not linked from the homepage (e.g., articles that scroll off the latest section, tags with a single article, author pages not featured anywhere) may never be indexed.

This is especially damaging as the content library grows. A site with 500 articles but no sitemap may only have 50 indexed if the internal link graph is thin.

### 5. No structured data (JSON-LD) — rich results are impossible
There is no schema.org markup anywhere in the codebase. Zero. This means:
- Articles cannot appear as rich results in Google Search (no `Article` or `NewsArticle` schema)
- The site cannot appear in Google's "Top stories" carousel (requires `NewsArticle` schema with `datePublished`)
- Breadcrumbs will not appear in search snippets (no `BreadcrumbList` schema)
- Podcast episodes cannot appear in Google Podcasts / rich audio results (no `PodcastEpisode` schema)
- The organization will never appear in the Google Knowledge Panel (no `Organization` schema in root layout)

For a media site, `NewsArticle` schema + correct dates is one of the highest-ROI SEO investments available.

**Files:** None exist. Should be added to `app/articles/[slug]/page.tsx`, `app/layout.tsx`, `app/podcast/page.tsx`

### 6. No canonical URLs — duplicate content risk is live
No page sets `alternates.canonical` in its metadata. Tag slugs can be accessed with different URL-encoded variants (e.g., `/tag/Sci-Fi` vs `/tag/sci-fi` vs `/tag/Sci%2DFi`). If tags are created with mixed case in the admin CMS, multiple URLs could return the same content and compete against each other in search results.

The article slug generation in `lib/posts/slug.ts` should be lowercase-normalized, but if admin creates a post with a non-normalized slug, there is no canonical to consolidate the authority.

### 7. Auth and utility pages are not marked noindex
`/login`, `/signup`, `/forgot-password`, `/update-password`, `/complete-profile` have no `robots: { index: false }` in their metadata. These pages currently have no metadata at all (title only, no description). Google will crawl and potentially index them. Auth pages appearing in search results is not useful, and they waste crawl budget that should go to content pages.

**Files:** `app/login/page.tsx`, `app/signup/page.tsx`, `app/forgot-password/page.tsx`, `app/update-password/page.tsx`, `app/complete-profile/page.tsx`

### 8. Search results pages should not be indexed
`/search?q=anime` and similar URLs are dynamic query-param pages that should never be indexed. Currently there is no `robots: { index: false }` on the search page, and no `X-Robots-Tag` header. Google may index hundreds of search result URLs with different queries, creating thin-content pages that dilute the site's quality signal.

**File:** `app/search/page.tsx`

---

## Weak Structure

### 9. Homepage (`/`) has no dedicated metadata — inherits generic root layout title
`app/page.tsx` exports no `metadata` and no `generateMetadata`. The homepage uses the root layout title: `"Geek My Interest"` with description `"Gaming, tech, reviews, and geek culture — a modern media platform for the community."` There is no `openGraph.title`, no `openGraph.description`, no `openGraph.image`, no `twitter.card`. The homepage title is also not site-brand optimized (the ideal pattern is `"Geek My Interest | Movies, Anime, Games & Tech"` which includes keywords).

**File:** `app/page.tsx`

### 10. No breadcrumb navigation — internal link context is invisible to crawlers
There is no breadcrumb component anywhere in the codebase. Article pages show the article title and author but no path context (`Home > Anime > Article Title`). Tag pages show a heading but no trail back to the homepage. Breadcrumbs serve two purposes: they are part of `BreadcrumbList` structured data (which shows navigation path in Google snippets), and they create short internal links that distribute PageRank up the content hierarchy.

### 11. Tag pages show a slug in monospace but no canonical
`app/tag/[slug]/page.tsx` line 46 displays `<p className="font-mono text-xs text-zinc-500">/{tag.slug}</p>` — the slug is shown as UI, but there is no `alternates.canonical` metadata. If the same tag is accessible at both `/tag/anime` and `/tag/Anime`, both pages would be indexed as separate pages.

### 12. No pagination on tag and author archive pages
`fetchPublishedPostsByTagSlug` and `fetchPublishedPostsByAuthorId` return all posts with no limit or pagination. When a tag has 50+ articles, the entire list is rendered on a single page. This creates:
- Very long pages that may have thin individual items (cards with only title + image)
- No page 2 URLs to index (less total indexable surface area)
- No `<link rel="prev/next">` pagination signals

**File:** `app/tag/[slug]/page.tsx`, `app/authors/[username]/page.tsx`

---

## Missing Metadata

### 13. Article hero image has empty alt text
`app/articles/[slug]/page.tsx` line 77: `<Image src={heroUrl} alt="" ...>`. An empty `alt=""` means both screen readers and Google Image Search receive no text description for the article's primary visual. Google Images is a real discovery channel for media sites.

### 14. `post.excerpt` exists in the database schema but is never used in metadata
`lib/database.types.ts` line 68 defines `excerpt: string | null` on the post row. The admin CMS almost certainly allows editors to write this. But `generateMetadata` in `app/articles/[slug]/page.tsx` does not read `post.excerpt` at all. This is the lowest-effort fix for the most impactful gap: one line of code would give every article a real meta description.

### 15. Author pages have no meta description
`generateMetadata` in the authors page only returns a title (`"username — Authors — Geek My Interest"`). There is no description generated (e.g., `"Articles by {username} on Geek My Interest — covering movies, anime, gaming, and tech."`).

---

## Indexing Problems

### 16. No `generateStaticParams` on article or tag routes
`app/articles/[slug]/page.tsx` and `app/tag/[slug]/page.tsx` have no `generateStaticParams` export. This means every article is rendered on first request (server-side), not pre-built at deploy time. While ISR via `revalidatePath` handles updates, a Googlebot crawl of a URL that has never been visited will trigger a live Supabase query. If the database is slow or unavailable, the crawler receives a 500 and the page is not indexed.

Pre-building known slugs at deploy time is safer and faster for crawlers.

### 17. Category browsing pages do not exist
There is no `/category/anime` or `/category/movies` route. The `PostCategoryDb` enum has five values (Movie, Anime, Show, Game, Tech) but there are no archive pages for them. Users and crawlers cannot browse by category. Search engines cannot see a page that signals "this site covers anime" in its URL and heading — that signal lives only in individual article content.

---

## Performance Risks

### 18. No image alt text on the article hero damages Core Web Vitals perception
Beyond SEO, `alt=""` on the hero image means if the image fails to load (Supabase storage outage, CDN error), there is no fallback text. The `<Image>` component renders a blank space with no indication of what was there.

### 19. Full-text search uses ILIKE, not a search index
`lib/posts/search-published.ts` uses `ILIKE '%query%'` across title, excerpt, and tag names. On a Supabase free tier with hundreds of posts, this performs a sequential table scan on every search keystroke. There is no `pg_trgm` trigram index, no Supabase full-text search (`to_tsvector`), and no external search index (Algolia, Typesense). At scale, search will be slow and database load will spike on popular queries.

---

## UX Problems

### 20. No visual indication of content categories on the homepage
The `EditorialLeadSection` and `LatestSection` components show post cards, but there is no category filter or navigation strip at the homepage level. A new visitor cannot immediately filter by "show me only anime" or "show me only games." This reduces session depth for visitors with a single-category interest.

### 21. No "related articles" or "more like this" section on article pages
`app/articles/[slug]/page.tsx` ends with comments. There is no `RelatedArticles` component that shows posts with the same tag or category. This means the user journey ends at the bottom of every article with no next step except the navbar. Media sites typically generate 30–60% of their pageviews from related content widgets.

### 22. No RSS feed
There is no `/feed.xml` or `/articles.rss` route. RSS feeds are used by:
- Aggregator sites (Feedly, Inoreader) that can drive referral traffic
- Podcast apps that may aggregate the site's podcast feed
- Google News (which can accept RSS for indexing signals)
- Other site owners who want to follow the content

### 23. No "back to top" or article progress indicator
The article pages have no scroll progress or jump-to-section navigation. For long editorial articles with 10+ sections (the `section_1_text` through `section_15_text` schema supports very long content), there is no way for a reader to know how far through they are or jump to a section.
