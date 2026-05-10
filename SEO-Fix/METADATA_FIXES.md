# Metadata Fixes

All pages audited for title, description, Open Graph, Twitter Card, and canonical.

---

## Root Layout (`app/layout.tsx`)

**Before:** `metadataBase` missing — relative OG image paths cannot resolve.

**Fix:**
- Add `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://geekmyinterest.com")`
- Add default `openGraph` and `twitter` metadata as fallback for all pages

---

## Homepage (`app/page.tsx`)

**Before:** No `metadata` export at all.

**After:**
```ts
export const metadata: Metadata = {
  title: "Geek My Interest — Gaming, Anime, Movies & Tech",
  description: "Hot takes, deep dives, and reviews across gaming, anime, movies, shows, and tech culture.",
  openGraph: {
    title: "Geek My Interest",
    description: "Hot takes, deep dives, and reviews across gaming, anime, movies, shows, and tech culture.",
    url: "/",
    siteName: "Geek My Interest",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};
```

---

## Article Pages (`app/articles/[slug]/page.tsx`)

**Before:** `generateMetadata` returns title only.

**After:**
- `description`: `post.excerpt` (trimmed to 155 chars) or fallback
- `alternates.canonical`: `${siteUrl}/articles/${slug}`
- `openGraph`: full type `"article"`, OG image from `postImagePublicUrl(post.hero_image ?? post.card_image)`
- `twitter`: `summary_large_image`
- Hero image: `alt=""` → `alt={post.title}` (accessibility + SEO)

---

## Author Pages (`app/authors/[username]/page.tsx`)

**Before:** Title only, no description or canonical.

**After:**
- `description`: "Articles by {username} on Geek My Interest."
- `alternates.canonical`: `${siteUrl}/authors/${username}`
- `openGraph`: type `"profile"`, title, description

---

## Tag Archive Pages (`app/tag/[slug]/page.tsx`)

**Before:** Title + description. Missing OG, Twitter, canonical.

**After:**
- `alternates.canonical`: `${siteUrl}/tag/${slug}`
- `openGraph`: title, description, type `"website"`
- `twitter`: `summary`

---

## Category Archive Pages (`app/category/[slug]/page.tsx`)

**New page.** Full metadata:
- `title`: `"{Category}" Articles — Geek My Interest`
- `description`: "Browse all {category} reviews, news and analysis on Geek My Interest."
- `alternates.canonical`: `${siteUrl}/category/${slug}`
- `openGraph`: full

---

## Podcast Page (`app/podcast/page.tsx`)

**Before:** Title + description. Missing OG, Twitter.

**After:**
- `openGraph.images`: `/images/podtrans.png`
- `twitter.card`: `summary_large_image`

---

## Contact Page (`app/contact/page.tsx`)

**Before:** Title + description. Missing OG, canonical.

**After:**
- `alternates.canonical`: `${siteUrl}/contact`
- `openGraph`: title, description, url

---

## Noindex Pages

All utility/auth pages get `robots: { index: false, follow: false }`:

| Page | Reason |
|------|--------|
| `/login` | Auth utility |
| `/signup` | Auth utility |
| `/forgot-password` | Auth utility |
| `/update-password` | Auth utility |
| `/complete-profile` | Auth utility |
| `/search` | Thin/dynamic content — infinite variants |

---

## Sitemap Coverage

`app/sitemap.ts` generates entries for:
- `/` (homepage)
- `/podcast`
- `/contact`
- All `/articles/[slug]` — published posts only
- All `/tag/[slug]` — all tags
- All `/category/[slug]` — 5 fixed slugs

`app/robots.ts` disallows:
- `/admin/`
- `/api/`
- `/auth/`
- `/login`
- `/signup`
- `/complete-profile`
- `/update-password`
- `/forgot-password`
