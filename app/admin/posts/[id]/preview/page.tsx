import { ArticleComments } from "@/components/articles/ArticleComments";
import { ArticleEditorialContent } from "@/components/articles/ArticleEditorialContent";
import { ArticleTagPills } from "@/components/articles/ArticleTagPills";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { getSessionUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { fetchCommentsForPost } from "@/lib/comments/queries";
import { postImagePublicUrl } from "@/lib/posts/image-url";
import { fetchPostByIdForAdmin, fetchProfilesByIds } from "@/lib/posts/queries";
import { fetchTagsForPostId } from "@/lib/tags/queries";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Params = { id: string };

export default async function AdminPostPreviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const session = await getSessionUser();
  if (!session?.user) redirect("/login?next=/admin");
  if (!isAdmin(session.profile ?? null)) notFound();

  const { id } = await params;
  const post = await fetchPostByIdForAdmin(id);
  if (!post) notFound();

  const [heroUrl, profiles, comments, tags] = await Promise.all([
    postImagePublicUrl(post.hero_image ?? post.card_image),
    fetchProfilesByIds([post.author_id]),
    fetchCommentsForPost(post.id),
    fetchTagsForPostId(post.id),
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

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <article className="relative z-10 mx-auto max-w-3xl px-5 pb-20 pt-28 sm:px-8 lg:px-12">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="rounded-md border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200">
            Admin preview
          </p>
          <Link
            href={`/admin/posts/${post.id}/edit`}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
          >
            Back to editor
          </Link>
        </div>

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
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-[0_0_24px_-6px_rgba(34,211,238,0.35)]">
            <Image
              src={heroUrl}
              alt={post.title}
              fill
              className="object-cover"
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
