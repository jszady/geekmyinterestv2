import { ArticleComments } from "@/components/articles/ArticleComments";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ArticleEditorialContent } from "@/components/articles/ArticleEditorialContent";
import { ArticleTagPills } from "@/components/articles/ArticleTagPills";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { fetchCommentsForPost } from "@/lib/comments/queries";
import { getSessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { CATEGORY_BY_SLUG, slugFromDbCategory } from "@/lib/posts/categories";
import { postImagePublicUrl } from "@/lib/posts/image-url";
import {
  fetchProfilesByIds,
  fetchPublishedPostBySlug,
} from "@/lib/posts/queries";
import {
  articleBreadcrumbs,
  blogPostingSchema,
} from "@/lib/schema";
import {
  articleMetaDescription,
  buildCanonicalUrl,
  buildPageMetadata,
  resolveArticleSeoImageUrl,
} from "@/lib/seo";
import { fetchTagsForPostId } from "@/lib/tags/queries";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublishedPostBySlug(slug);
  if (!post) return { title: "Article" };

  const [ogImageUrl, profiles] = await Promise.all([
    resolveArticleSeoImageUrl(post),
    fetchProfilesByIds([post.author_id]),
  ]);

  const authorProfile = profiles.get(post.author_id);
  const authorName = authorProfile?.username?.trim() || undefined;
  const description = articleMetaDescription(post);
  const published = post.published_at ?? post.created_at;
  const modified = post.updated_at ?? published;

  return buildPageMetadata({
    title: post.title,
    description,
    canonicalPath: `/articles/${slug}`,
    ogType: "article",
    ogImageUrl: ogImageUrl,
    ogImageAlt: post.title,
    publishedTime: published,
    modifiedTime: modified,
    authors: authorName ? [authorName] : undefined,
  });
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await fetchPublishedPostBySlug(slug);
  if (!post) notFound();

  const [heroUrl, profiles, comments, session, tags, ogImageUrl] = await Promise.all([
    postImagePublicUrl(post.hero_image),
    fetchProfilesByIds([post.author_id]),
    fetchCommentsForPost(post.id),
    getSessionUser(),
    fetchTagsForPostId(post.id),
    resolveArticleSeoImageUrl(post),
  ]);

  const authorProfile = profiles.get(post.author_id);
  const authorUsernameRaw = authorProfile?.username ?? null;
  const authorAvatarUrl = authorProfile?.avatar_url ?? null;
  const authorUsername = authorUsernameRaw?.trim() || null;
  const authorHref = authorUsername
    ? `/authors/${encodeURIComponent(authorUsername)}`
    : null;
  const authorDisplay = authorUsername ?? "Geek My Interest";
  const when = post.published_at ?? post.created_at;
  const loginNext = `/login?next=${encodeURIComponent(`/articles/${post.slug}`)}`;

  const categorySlug = slugFromDbCategory(String(post.category));
  const categoryLabel = categorySlug
    ? CATEGORY_BY_SLUG[categorySlug].label
    : String(post.category);
  const description = articleMetaDescription(post);
  const articlePath = `/articles/${post.slug}`;
  const published = post.published_at ?? post.created_at;
  const modified = post.updated_at ?? published;

  const jsonLd = [
    blogPostingSchema({
      headline: post.title,
      description,
      imageUrl: ogImageUrl,
      datePublished: published,
      dateModified: modified,
      authorName: authorUsername ?? undefined,
      authorUrl: authorUsername
        ? buildCanonicalUrl(`/authors/${encodeURIComponent(authorUsername)}`)
        : undefined,
      articleUrl: buildCanonicalUrl(articlePath),
      articleSection: String(post.category),
    }),
    articleBreadcrumbs(categorySlug, categoryLabel, post.title, articlePath),
  ];

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <JsonLd data={jsonLd} />
      <SiteBackdrop />
      <Navbar />
      <article className="relative z-10 mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8 lg:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
          {String(post.category)}
        </p>
        <h1
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl"
          style={{ textShadow: "0 0 22px rgba(34,211,238,0.25)" }}
        >
          {post.title}
        </h1>
        <ArticleTagPills tags={tags} />
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-400">
          <span>By</span>
          <span className="inline-flex items-center gap-2">
            <UserAvatar
              username={authorUsernameRaw}
              avatarUrl={authorAvatarUrl}
              size="sm"
              decorative
            />
            {authorHref ? (
              <Link href={authorHref} className="font-semibold text-cyan-200 hover:text-cyan-100">
                {authorDisplay}
              </Link>
            ) : (
              <span className="font-semibold text-zinc-200">{authorDisplay}</span>
            )}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={when}>{new Date(when).toLocaleDateString()}</time>
        </div>
        {heroUrl ? (
          <div className="relative mx-auto mt-8 aspect-[16/9] w-full max-w-full overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-[0_0_24px_-6px_rgba(34,211,238,0.35),inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <Image
              src={heroUrl}
              alt={post.title}
              fill
              className="h-full w-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, 720px"
              priority
            />
          </div>
        ) : null}

        <ArticleEditorialContent post={post} />

        <ArticleComments
          postId={post.id}
          postSlug={post.slug}
          comments={comments}
          canComment={!!session?.user}
          loginNextPath={loginNext}
          currentUserId={session?.user?.id ?? null}
          isAdmin={isAdmin(session?.profile ?? null)}
        />
        <RelatedArticles
          postId={post.id}
          tagIds={tags.map((t) => t.id)}
          category={String(post.category)}
        />
      </article>
    </main>
  );
}
