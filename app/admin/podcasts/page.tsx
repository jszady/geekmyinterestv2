import { fetchAllPodcastEpisodesForAdmin } from "@/lib/podcast/queries";
import Link from "next/link";

export default async function AdminPodcastsPage() {
  const episodes = await fetchAllPodcastEpisodesForAdmin();

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Manage podcast episodes, thumbnail uploads, and platform links.
      </p>
      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#050a14]/80">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Episode</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {episodes.map((ep) => (
              <tr key={ep.id} className="border-b border-white/[0.04] last:border-0">
                <td className="px-4 py-3 font-medium text-zinc-100">
                  <span className="text-zinc-500">
                    {ep.episode_number ? `Ep. ${ep.episode_number} · ` : ""}
                  </span>
                  {ep.title}
                </td>
                <td className="px-4 py-3 text-zinc-400">{ep.status}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {ep.updated_at ?? ep.created_at
                    ? new Date(ep.updated_at ?? ep.created_at).toLocaleString()
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/podcasts/${ep.id}/edit`}
                    className="font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!episodes.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No podcast episodes yet.{" "}
                  <Link href="/admin/podcasts/new" className="text-cyan-300 hover:underline">
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
