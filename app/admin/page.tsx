import { fetchAllPostsForAdmin } from "@/lib/posts/queries";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const posts = await fetchAllPostsForAdmin();

  return (
    <div className="space-y-6" data-testid="admin-dashboard">
      <p className="text-sm text-zinc-400">
        Manage posts, homepage slots, and images. Only admins can view this area.
      </p>
      <div
        className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#050a14]/80"
        data-testid="admin-posts-table"
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Slot</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.04] last:border-0">
                <td className="px-4 py-3 font-medium text-zinc-100">{p.title}</td>
                <td className="px-4 py-3 text-zinc-400">{p.status}</td>
                <td className="px-4 py-3 text-zinc-400">{p.homepage_slot ?? "—"}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {p.updated_at ?? p.created_at
                    ? new Date(p.updated_at ?? p.created_at).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    className="font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!posts.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No posts yet.{" "}
                  <Link href="/admin/posts/new" className="text-cyan-300 hover:underline">
                    Create one
                  </Link>
                  .
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
