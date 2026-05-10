import type { TagRow } from "@/lib/database.types";
import Link from "next/link";

type Props = { tags: TagRow[] };

export function ArticleTagPills({ tags }: Props) {
  if (!tags.length) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((t) => (
        <li key={t.id}>
          <Link
            href={`/tag/${encodeURIComponent(t.slug)}`}
            className="inline-flex items-center rounded-full border border-violet-400/25 bg-gradient-to-r from-violet-500/[0.12] to-cyan-500/[0.1] px-3 py-1 text-xs font-semibold text-zinc-100 shadow-[0_0_16px_-6px_rgba(139,92,246,0.45)] transition hover:border-cyan-400/40 hover:from-violet-500/18 hover:to-cyan-500/16 hover:text-white hover:shadow-[0_0_20px_-4px_rgba(34,211,238,0.35)]"
          >
            {t.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
