import { AdminPostFormV2 } from "@/components/admin/AdminPostFormV2";
import Link from "next/link";

export const metadata = {
  title: "New post V2 — Admin",
};

export default function NewPostV2Page() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">
            ← All posts
          </Link>
          <h2 className="mt-2 text-xl font-bold text-white">New post V2 (blocks)</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Flexible content blocks. For the classic 15-section editor, use{" "}
            <Link href="/admin/posts/new" className="text-cyan-400 hover:underline">
              New post
            </Link>
            .
          </p>
        </div>
      </div>
      <AdminPostFormV2 mode="create" />
    </div>
  );
}
