import { AdminDeletePodcastButton } from "@/components/admin/AdminDeletePodcastButton";
import { AdminPodcastForm } from "@/components/admin/AdminPodcastForm";
import { fetchPodcastEpisodeByIdForAdmin } from "@/lib/podcast/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { id: string };

export default async function EditPodcastEpisodePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const episode = await fetchPodcastEpisodeByIdForAdmin(id);
  if (!episode) notFound();

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/podcasts"
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← All episodes
          </Link>
          <h2 className="mt-2 text-xl font-bold text-white">Edit podcast episode</h2>
        </div>
        <Link
          href="/podcast"
          className="text-sm font-semibold text-zinc-400 hover:text-cyan-200"
        >
          View podcast page →
        </Link>
      </div>
      <AdminPodcastForm mode="edit" episode={episode} />
      <AdminDeletePodcastButton episodeId={episode.id} title={episode.title} />
    </div>
  );
}
