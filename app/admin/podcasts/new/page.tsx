import { AdminPodcastForm } from "@/components/admin/AdminPodcastForm";

export const metadata = {
  title: "New podcast episode — Admin",
};

export default function NewPodcastEpisodePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Create podcast episode</h2>
      <AdminPodcastForm mode="create" />
    </div>
  );
}
