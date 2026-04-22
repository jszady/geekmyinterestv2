import { AdminDeletePostButton } from "@/components/admin/AdminDeletePostButton";
import { AdminPostForm } from "@/components/admin/AdminPostForm";
import { fetchPostByIdForAdmin } from "@/lib/posts/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { id: string };

export default async function EditPostPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const post = await fetchPostByIdForAdmin(id);
  if (!post) notFound();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
            ← All posts
          </Link>
          <h2 className="mt-2 text-xl font-bold text-white">Edit post</h2>
        </div>
        <Link
          href={`/articles/${post.slug}`}
          className="text-sm font-semibold text-zinc-400 hover:text-cyan-200"
        >
          View live →
        </Link>
      </div>
      <AdminPostForm mode="edit" post={post} />
      <AdminDeletePostButton postId={post.id} title={post.title} />
    </div>
  );
}
