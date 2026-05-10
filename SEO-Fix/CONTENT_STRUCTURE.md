# Content Structure

## Category Taxonomy

The database stores `category` as a typed enum with 5 values:

| DB Value | URL Slug | Display Label |
|----------|----------|---------------|
| `Movie` | `/category/movies` | Movies |
| `Anime` | `/category/anime` | Anime |
| `Show` | `/category/shows` | Shows |
| `Game` | `/category/games` | Games |
| `Tech` | `/category/tech` | Tech |

Category pages are browsable archives at `/category/[slug]`. They are indexed and included in the sitemap.

---

## Internal Linking Strategy

### Related Articles (article pages)

Each article page shows 3 related posts below the comment section. The selection algorithm:
1. **Primary:** Posts sharing at least one tag with the current article (ordered by recency)
2. **Fallback:** Most recent posts in the same category if fewer than 3 tag matches are found

This creates tag-based internal links across the site and improves crawl depth.

### Article Tag Pills

Every article displays its tags as clickable pills (`/tag/[slug]`). This connects articles through shared tags and gives users a navigation path to related content.

### Category Archive Links

The navbar and article category labels should link to `/category/[slug]` so readers can browse by category. This is a future enhancement — the pages exist and are indexed, but the nav does not yet link to them.

---

## Page Hierarchy

```
/ (homepage — editorial + latest)
├── /articles/[slug]     (individual articles)
├── /category/movies     (Movie archive)
├── /category/anime      (Anime archive)
├── /category/shows      (Show archive)
├── /category/games      (Game archive)
├── /category/tech       (Tech archive)
├── /tag/[slug]          (tag archives)
├── /authors/[username]  (author pages)
├── /podcast             (podcast hub)
├── /contact             (contact hub)
└── /search              (noindexed)
```

---

## Sitemap Priority Guidance

| Page type | Priority | Change frequency |
|-----------|----------|-----------------|
| Homepage | 1.0 | daily |
| Category archives | 0.8 | weekly |
| Individual articles | 0.7 | monthly |
| Tag archives | 0.5 | weekly |
| Author pages | 0.5 | monthly |
| Podcast | 0.6 | weekly |
| Contact | 0.3 | yearly |

---

## Content Recommendations (Pre-Launch)

1. **Excerpts on all posts** — `post.excerpt` is used for `og:description` and search snippets. Posts without an excerpt fall back to the title. Ensure every published post has a 120–155 character excerpt.

2. **Hero images on all posts** — `hero_image` or `card_image` is used as the OG image. A post without either will have no social preview image. Ensure all published posts have at least a card image.

3. **Category distribution** — Ensure posts are spread across categories before launch so each category archive page has content.

4. **Tag coverage** — Tags drive the Related Articles section. Posts with no tags will not surface related content. Add at least 2–3 tags per post.
