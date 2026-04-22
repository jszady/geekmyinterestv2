import type { PostCardData, PostCategory } from "@/components/feed/types";
import type { PostRow } from "@/lib/database.types";
import { postImagePublicUrl } from "@/lib/posts/image-url";

const CATEGORY_SET = new Set<PostCategory>([
  "Movie",
  "Show",
  "Anime",
  "Game",
  "Tech",
]);

function toCategory(raw: string): PostCategory {
  if (CATEGORY_SET.has(raw as PostCategory)) return raw as PostCategory;
  return "Movie";
}

export async function postRowToCardData(
  row: PostRow,
  opts?: { imagePath?: string | null; alt?: string },
): Promise<PostCardData> {
  const imgPath =
    opts?.imagePath ?? row.card_image ?? row.hero_image ?? null;
  const src = (await postImagePublicUrl(imgPath)) ?? "/images/logo/logo.png";
  return {
    href: `/articles/${row.slug}`,
    title: row.title,
    category: toCategory(String(row.category)),
    image: {
      src,
      alt: opts?.alt ?? row.title,
    },
    excerpt: row.excerpt ?? undefined,
  };
}

export async function postRowToLatestCard(
  row: PostRow,
  authorName: string | null,
): Promise<PostCardData> {
  const card = await postRowToCardData(row);
  const created = new Date(row.created_at);
  const timeLabel = formatRelativeTime(created);
  return {
    ...card,
    excerpt: row.excerpt ?? card.title.slice(0, 160),
    author: authorName ?? "Staff",
    timeLabel,
  };
}

function formatRelativeTime(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}
