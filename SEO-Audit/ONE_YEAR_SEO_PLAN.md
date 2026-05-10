# One-Year SEO Plan for Geek My Interest

This plan assumes the site launches to the public within the next 30 days. All phases are sequenced to build on each other: technical fixes first, content infrastructure second, topical authority third, growth and compounding fourth.

---

## Phase 1: Foundation (Days 0–30)
*Get the technical basics in place before any traffic arrives. Nothing else matters until this is done.*

### Technical SEO Sprint

**Week 1 — Critical metadata:**
- Add `post.excerpt` as `description` to `generateMetadata` in `app/articles/[slug]/page.tsx`
- Add `openGraph` and `twitter` fields to article `generateMetadata` using hero/card image
- Add `export const metadata` with `openGraph` and `twitter` to `app/page.tsx` (homepage)
- Add `openGraph` and `twitter` to `app/podcast/page.tsx`
- Create a branded default OG image (`public/images/og-default.png`, 1200×630)

**Week 1 — Indexing control:**
- Create `app/robots.ts` — disallow `/admin/`, `/api/`, `/auth/`
- Create `app/sitemap.ts` — enumerate published articles, tag pages, and static pages
- Add `robots: { index: false }` to all auth pages (`/login`, `/signup`, `/forgot-password`, `/update-password`, `/complete-profile`)
- Add `robots: { index: false }` to `/search` page

**Week 2 — Structured data:**
- Add `NewsArticle` JSON-LD to `app/articles/[slug]/page.tsx`
- Add `Organization` JSON-LD to `app/layout.tsx`
- Add `BreadcrumbList` JSON-LD to article and tag pages

**Week 2 — Core fixes:**
- Fix `alt=""` on hero image in `app/articles/[slug]/page.tsx` — use `post.title`
- Add `alternates.canonical` to article, tag, and author `generateMetadata`
- Add meta description to author page `generateMetadata`
- Set `NEXT_PUBLIC_SITE_URL` in production environment variables

**Week 3 — Content infrastructure:**
- Create `app/category/[slug]/page.tsx` for Movie, Anime, Show, Game, Tech archives
- Add category links to the Navbar
- Add `generateStaticParams` to `app/articles/[slug]/page.tsx` with hourly revalidation
- Create `app/feed.xml/route.ts` RSS feed

**Week 4 — Search Console setup:**
- Submit the sitemap to Google Search Console
- Submit the sitemap to Bing Webmaster Tools
- Verify site ownership via DNS TXT record
- Set up a `NEXT_PUBLIC_SITE_URL` env var for consistent canonical URLs
- Tag the site in Google Search Console as a "News" site if applying for Google News

### Content Strategy — Month 1
*Publish at minimum 2 articles per week. Volume matters for initial indexing.*

- Each article must have an `excerpt` filled in the admin CMS (this becomes the meta description)
- Each article must have a `hero_image` or `card_image` uploaded (this becomes the OG image)
- Each article must be assigned at least 2 tags from the existing taxonomy
- Priority topics for launch: whatever is in the news cycle for anime, Marvel/DC, and a major game release. These have existing search demand and social sharing momentum.

### Keyword Strategy — Month 1
*Target "second-tier" keywords — not the mega-volume head terms, but the qualified mid-tail ones.*

Bad target: "anime" (500M results, dominated by MAL, Crunchyroll, Wikipedia)
Good targets:
- "{Show Name} episode {N} review" (after a major seasonal anime premiere)
- "{Movie Title} ending explained"
- "is {Game Title} worth buying"
- "{Franchise} {season} ranking worst to best"

These are the query patterns that media sites with under 10k monthly visits can actually rank for. Chase the news cycle in a specific niche — don't try to own "anime" on day one.

---

## Phase 2: Topical Authority (Months 1–3)
*By month 3, Google should see this site as a credible source on at least 2 of the 5 topic clusters.*

### Technical SEO
- Implement pagination on tag and author archive pages (24 posts per page, `rel="next/prev"`)
- Replace ILIKE search with Postgres `tsvector` full-text search (Supabase migration + `search_vector` column)
- Add `WebSite` JSON-LD with `SearchAction` to root layout (enables Google Sitelinks Search Box)
- Add `Person` JSON-LD to `app/authors/[username]/page.tsx`
- Implement related articles section on article pages (query by shared tags, limit 3)
- Add Open Graph to `app/tag/[slug]/page.tsx` and `app/contact/page.tsx`

### Content Strategy — Months 1–3
*Pick 2 content formats and own them.*

**Format 1: Timeliness (news cycle content)**
- Publish within 24 hours of major announcements, trailers, and releases
- Use exact match titles: `"{Title} Trailer Reaction"`, `"Is {Title} Worth Watching?"`, `"{Title} Season 2 Release Date"`
- These rank quickly (1–2 weeks) for low-competition queries and drive social shares

**Format 2: Evergreen rankings (long-tail, permanent traffic)**
- "Best [anime subgenre] of [year]"
- "Every [franchise] movie ranked from worst to best"
- "[Show] episodes ranked"
- These accumulate backlinks over time and rank for years

Minimum publishing cadence: 3 articles per week. 2 timely + 1 evergreen.

### Keyword Strategy — Months 1–3
*Build topic clusters, not isolated articles.*

A topic cluster works like this:
- **Pillar page:** `/tag/marvel` — the tag archive page, constantly updated as new articles are published
- **Cluster articles:** Individual reviews, analyses, rankings of MCU content — all tagged `marvel`

Each cluster article links to the tag page and to related articles. The tag page links back to all articles. This internal link network tells Google that the site has depth on Marvel, not just a single article.

Focus clusters for months 1–3:
1. Anime seasonal (highest posting velocity, niche community is active)
2. Marvel/DC (broad audience, always in the news cycle)

Defer: Tech coverage (competitive, broad), Gaming (very competitive head terms)

### Podcast SEO
- Add `PodcastSeries` JSON-LD to `app/podcast/page.tsx`
- Submit the podcast RSS feed to Apple Podcasts, Spotify, and Google Podcasts
- Create individual episode pages at `/podcast/[slug]` with `PodcastEpisode` JSON-LD if individual episodes exist in the DB
- Title each podcast episode for search, not just for listeners: `"Superhero Fatigue Explained — Ep. 8 | Geek My Interest Podcast"` ranks for queries; `"Is Superhero Fatigue Real?"` alone does not.

### Internal Linking Strategy — Months 1–3
*Establish a consistent linking pattern from day one.*

1. Every article links to its tag pages (already done via `ArticleTagPills`)
2. Every article links to the author page (already done via author byline)
3. Add manual "see also" links within article body: when mentioning a franchise or show, link to an existing article about it
4. Category pages link to tag pages for related sub-topics
5. The homepage editorial slots should prioritize articles in the currently active topic clusters

Avoid orphan pages: every published article should be reachable in 2 clicks from the homepage.

---

## Phase 3: Scalable Growth Infrastructure (Months 3–6)
*By month 6, the site should be ranking for 50–100 target queries and generating consistent organic traffic.*

### Technical SEO
- Implement `app/category/[slug]` with fully optimized metadata, JSON-LD, and pagination
- Create a dedicated podcast episode archive if individual episode pages are built
- Add a `WebPage` JSON-LD to static pages (contact, podcast)
- Evaluate Algolia or Typesense for search if post count exceeds 200
- Add `lastmod` dates to sitemap entries using `post.published_at`
- Set up a Google News Publisher Center application if the site publishes news-adjacent content consistently

### Content Strategy — Months 3–6
*Expand to a third topic cluster. Start building content depth.*

**Expand to gaming coverage:**
- "Is {Game} worth buying" review format (high intent, purchase-decision queries)
- Platform-specific coverage: PC gaming, console, indie — pick one and focus
- Game launch reviews timed to release dates (traffic spike + long-term ranking)

**Introduce the "deep dive" format:**
- 2,000+ word analysis pieces on a franchise, character arc, or industry trend
- These earn natural backlinks from fan wikis, Reddit posts, and other media sites
- The 15-section editorial schema (`section_1_text` through `section_15_text`) is already built for this format

**Guest contributors:**
- Add a second author in the admin CMS
- Two writing voices increases content velocity and gives the E-E-A-T signals of a real editorial team

### Podcast SEO — Months 3–6
- Build individual episode pages (`/podcast/[slug]`) if not already done
- Write a 200-word episode summary for each episode (this becomes the meta description and feeds search indexing)
- Add a transcript or partial transcript to each episode page (transcripts are high-value SEO content — Google indexes every word)
- Submit the podcast to additional directories: Amazon Music, iHeart, Pocket Casts

### Internal Linking Audit — Month 4
- Review the top 20 published articles for internal links
- Each article should have at least 2–3 outbound links to other articles on the site
- Tag pages should link to at least one "pillar" article (the definitive piece on that tag)
- Homepage editorial slots should be rotated monthly to surface older evergreen content

---

## Phase 4: Authority and Compounding (Months 6–12)
*By month 12, the site should have a stable domain authority, consistent traffic growth, and a content library of 100+ indexed articles.*

### Technical SEO
- Implement structured data for Reviews if any review articles exist (`Review` schema with `reviewRating`)
- Add `itemReviewed` schema to game/movie/anime review pages
- Evaluate lazy loading strategy for homepage if editorial section becomes large
- Set up Core Web Vitals monitoring via Google Search Console
- Audit image sizes — ensure no images over 200KB are served (Supabase storage images should be served with transformations)

### Content Strategy — Months 6–12
*Shift from volume to authority. Quality matters more than frequency at this stage.*

**Annual ranking features:**
- "Best anime of {year}" — publish in December, update in January
- "Every MCU movie ranked {year} edition" — evergreen with annual update
- "Top games of {year}" — year-end content that gets shared broadly
These pages accumulate links year over year. One URL that ranks for "best anime 2025" and is updated to "best anime 2026" retains all its backlink equity.

**Franchise hubs:**
- Dedicate one category or tag page per major franchise: MCU, DC, Dragon Ball, One Piece, etc.
- Internally link all related articles to the franchise hub page
- The hub page becomes the canonical "what we think about this franchise" page

### Backlink Strategy — Months 6–12
*Natural backlinks follow content that others want to cite.*

**Easiest backlink sources:**
1. Reddit AMAs or discussions in niche subreddits (r/anime, r/Marvel, r/gaming) — link to a relevant article when it adds value to the discussion. Never spam.
2. Fandom wikis: fan wikis often need references for "official commentary" or "reviews" — reach out to wiki editors when an article qualifies
3. Podcast guests: if the podcast brings on a guest (influencer, filmmaker, game developer), that guest's own audience often links back to the episode
4. Twitter/X engagement: long-form threads with a link to the full article drive both traffic and secondary shares

**Earned media targets:**
- Anime News Network's community section links to fan publications
- CBR and ScreenRant occasionally link to smaller sites for data or unique angles
- Forbes (games/tech section) links to niche gaming coverage for supporting data points

### Podcast SEO — Months 6–12
- Apply to Apple Podcasts' New & Noteworthy section (requires consistent publishing cadence and 5-star ratings)
- Cross-promote articles in podcast show notes: every episode links to 2–3 related articles
- Create a YouTube clip strategy: 60–90 second clips from each episode, each with its own description linking back to the episode page
- Each YouTube video description should contain the episode URL — this creates backlinks from YouTube (Google-owned, treated as high-authority)

### Growth KPIs to Track (Set Baselines at Launch)
*Track these monthly in Google Search Console and Google Analytics:*

| Metric | Month 1 Target | Month 6 Target | Month 12 Target |
|--------|---------------|----------------|-----------------|
| Indexed pages | 20+ | 100+ | 250+ |
| Organic impressions (Search Console) | 500/mo | 10,000/mo | 50,000/mo |
| Organic clicks | 50/mo | 1,000/mo | 8,000/mo |
| Average position | — | < 30 | < 20 |
| Pages with 100+ impressions | 5 | 30 | 100 |

---

## Ongoing — Every Month

- Check Search Console for crawl errors weekly; fix 404s by adding redirects in `next.config.ts`
- Update `post.excerpt` on every new article before publishing (this is a CMS discipline issue, not a code issue)
- Review top 5 landing pages monthly and add internal links to newer content from those pages
- Check sitemap submission status monthly in Search Console
- Review Core Web Vitals report monthly — flag any pages with LCP > 2.5s or CLS > 0.1

---

## Summary Priority Table

| Fix | Impact | Effort | Phase |
|-----|--------|--------|-------|
| Article meta description from `post.excerpt` | Critical | 5 min | 1 |
| Open Graph on articles + homepage | Critical | 1 hour | 1 |
| robots.ts + sitemap.ts | Critical | 2 hours | 1 |
| Noindex auth pages + search | High | 30 min | 1 |
| Fix article hero `alt=""` | High | 5 min | 1 |
| NewsArticle JSON-LD on articles | High | 2 hours | 1 |
| Canonical URLs | High | 1 hour | 1 |
| Category archive pages | High | 1 day | 2 |
| Related articles section | Medium | 1 day | 2 |
| RSS feed | Medium | 2 hours | 2 |
| Full-text search migration | Medium | 4 hours | 2 |
| Podcast episode pages | Medium | 2 days | 3 |
| Transcript on podcast episodes | High | ongoing | 3 |
| Annual ranking content | High | ongoing | 4 |
