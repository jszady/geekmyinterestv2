import { AdminPostForm } from "@/components/admin/AdminPostForm";

export const metadata = {
  title: "New post — Admin",
};

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Create post</h2>
      <AdminPostForm mode="create" />
    </div>
  );
}
