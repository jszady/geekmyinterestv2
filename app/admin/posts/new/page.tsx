import { AdminPostForm } from "@/components/admin/AdminPostForm";
import Link from "next/link";

export const metadata = {
  title: "New post — Admin",
};

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Create post</h2>
        <p className="mt-1 text-sm text-zinc-500">
          For flexible blocks instead of 15 sections, use{" "}
          <Link href="/admin/posts/new-v2" className="text-violet-300 hover:underline">
            New post V2
          </Link>
          .
        </p>
      </div>
      <AdminPostForm mode="create" />
    </div>
  );
}
