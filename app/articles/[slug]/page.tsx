import { ArticleComments } from "@/components/articles/ArticleComments";
import { ArticleEditorialContent } from "@/components/articles/ArticleEditorialContent";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { fetchCommentsForPost } from "@/lib/comments/queries";
import { getSessionUser } from "@/lib/auth/session";
import { postImagePublicUrl } from "@/lib/posts/image-url";
import {
  fetchProfilesByIds,
  fetchPublishedPostBySlug,
} from "@/lib/posts/queries";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await fetchPublishedPostBySlug(slug);
  if (!post) return { title: "Article — Geek My Interest" };
  return { title: `${post.title} — Geek My Interest` };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await fetchPublishedPostBySlug(slug);
  if (!post) notFound();

  const [heroUrl, profiles, comments, session] = await Promise.all([
    postImagePublicUrl(post.hero_image ?? post.card_image),
    fetchProfilesByIds([post.author_id]),
    fetchCommentsForPost(post.id),
    getSessionUser(),
  ]);

  const authorUsername = profiles.get(post.author_id)?.username ?? null;
  const authorHref = authorUsername
    ? `/authors/${encodeURIComponent(authorUsername)}`
    : null;
  const when = post.published_at ?? post.created_at;
  const loginNext = `/login?next=${encodeURIComponent(`/articles/${post.slug}`)}`;

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
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
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
          <span>By</span>
          {authorHref ? (
            <Link href={authorHref} className="font-semibold text-cyan-200 hover:text-cyan-100">
              {authorUsername ?? "Author"}
            </Link>
          ) : (
            <span className="font-semibold text-zinc-200">{authorUsername ?? "Author"}</span>
          )}
          <span aria-hidden>·</span>
          <time dateTime={when}>{new Date(when).toLocaleDateString()}</time>
        </div>

        {heroUrl ? (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-[0_0_24px_-6px_rgba(34,211,238,0.35)]">
            <Image src={heroUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 720px" priority />
          </div>
        ) : null}

        <ArticleEditorialContent post={post} />

        <ArticleComments
          postId={post.id}
          postSlug={post.slug}
          comments={comments}
          canComment={!!session?.user}
          loginNextPath={loginNext}
        />
      </article>
    </main>
  );
}
