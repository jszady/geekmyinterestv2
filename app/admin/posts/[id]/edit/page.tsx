import { AdminDeletePostButton } from "@/components/admin/AdminDeletePostButton";
import { AdminPostForm } from "@/components/admin/AdminPostForm";
import { AdminPostFormV2 } from "@/components/admin/AdminPostFormV2";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { postHasContentBlocks } from "@/lib/posts/content-blocks";
import { fetchPostByIdForAdmin, fetchProfilesByIds } from "@/lib/posts/queries";
import { fetchTagsForPostId } from "@/lib/tags/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { id: string };

export default async function EditPostPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const post = await fetchPostByIdForAdmin(id);
  if (!post) notFound();

  const [initialTags, authorProfiles] = await Promise.all([
    fetchTagsForPostId(post.id),
    fetchProfilesByIds([post.author_id]),
  ]);
  const author = authorProfiles.get(post.author_id);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
            ← All posts
          </Link>
          <h2 className="mt-2 text-xl font-bold text-white">
            {postHasContentBlocks(post) ? "Edit post (V2 blocks)" : "Edit post"}
          </h2>
        </div>
        {post.status === "published" ? (
          <Link
            href={`/articles/${post.slug}`}
            className="text-sm font-semibold text-zinc-400 hover:text-cyan-200"
          >
            View live →
          </Link>
        ) : (
          <Link
            href={`/admin/posts/${post.id}/preview`}
            className="text-sm font-semibold text-zinc-400 hover:text-cyan-200"
          >
            Preview →
          </Link>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/[0.08] bg-[#050a14]/60 px-4 py-3 text-sm text-zinc-300">
        <UserAvatar
          username={author?.username ?? null}
          avatarUrl={author?.avatar_url ?? null}
          size="md"
          decorative
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Author</p>
          <p className="font-medium text-zinc-100">{author?.username?.trim() || "Unknown"}</p>
          <p className="text-xs text-zinc-500">ID {post.author_id}</p>
        </div>
      </div>
      {postHasContentBlocks(post) ? (
        <AdminPostFormV2 mode="edit" post={post} initialTags={initialTags} />
      ) : (
        <AdminPostForm mode="edit" post={post} initialTags={initialTags} />
      )}
      <AdminDeletePostButton postId={post.id} title={post.title} />
    </div>
  );
}
