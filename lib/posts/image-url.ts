import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "post-images";

export async function postImagePublicUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path?.trim()) return null;
  const p = path.trim();
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const supabase = await createSupabaseServerClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(p);
  return data.publicUrl;
}
