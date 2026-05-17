import {
  AuthorProfileView,
  type AuthorArticle,
} from "@/components/authors/AuthorProfileView";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { postRowToCardData } from "@/lib/posts/map-row-to-card";
import {
  fetchProfileByUsername,
  fetchPublishedPostsByAuthorId,
} from "@/lib/posts/queries";
import { resolveAuthorHeaderImageForDisplay } from "@/lib/profile/author-header-display-url";
import { personSchema } from "@/lib/schema";
import {
  buildCanonicalUrl,
  buildPageMetadata,
  DEFAULT_OG_IMAGE_PATH,
  getAbsoluteUrl,
} from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Params = { username: string };

function formatMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
  } catch {
    return "recently";
  }
}

function formatArticleDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const profile = await fetchProfileByUsername(decoded);
  const name = profile?.username ?? decoded;
  const description = `Articles and content by ${name} on Geek My Interest.`;
  const path = `/authors/${encodeURIComponent(name)}`;

  return buildPageMetadata({
    title: `${name} | Authors`,
    description,
    canonicalPath: path,
    absoluteTitle: true,
    ogType: "website",
    ogImageUrl: getAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
    ogImageAlt: `${name} on Geek My Interest`,
  });
}

export default async function AuthorPage({ params }: { params: Promise<Params> }) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const profile = await fetchProfileByUsername(decoded);
  if (!profile?.id) notFound();

  const posts = await fetchPublishedPostsByAuthorId(profile.id);
  const articles: AuthorArticle[] = await Promise.all(
    posts.map(async (row) => {
      const card = await postRowToCardData(row);
      return {
        ...card,
        dateLabel: formatArticleDate(row.published_at ?? row.created_at),
      };
    }),
  );

  const display = profile.username?.trim() || "Author";
  const memberSinceLabel = formatMemberSince(profile.created_at);
  const rawHeader = profile.author_header_image ?? null;
  const authorHeaderResolved = await resolveAuthorHeaderImageForDisplay(rawHeader);
  const authorPath = `/authors/${encodeURIComponent(display)}`;

  const personLd = personSchema({
    name: display,
    url: buildCanonicalUrl(authorPath),
    description: profile.bio?.trim() || `Articles by ${display} on Geek My Interest.`,
    imageUrl: authorHeaderResolved ?? undefined,
  });

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <JsonLd data={personLd} />
      <SiteBackdrop />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8 lg:px-10">
        <AuthorProfileView
          displayName={display}
          avatarUrl={profile.avatar_url ?? null}
          authorHeaderImageUrl={authorHeaderResolved}
          bio={profile.bio ?? null}
          memberSinceLabel={memberSinceLabel}
          articles={articles}
        />
      </div>
    </main>
  );
}
