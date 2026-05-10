import { postRowToCardData } from "@/lib/posts/map-row-to-card";
import { fetchRelatedPosts } from "@/lib/posts/queries";
import Image from "next/image";
import Link from "next/link";

type Props = {
  postId: string;
  tagIds: string[];
  category: string;
};

export async function RelatedArticles({ postId, tagIds, category }: Props) {
  const posts = await fetchRelatedPosts(postId, tagIds, category, 3);
  if (!posts.length) return null;

  const cards = await Promise.all(posts.map((p) => postRowToCardData(p)));

  return (
    <section className="mt-16 border-t border-white/[0.07] pt-12" aria-labelledby="related-heading">
      <h2
        id="related-heading"
        className="text-lg font-bold text-white"
        style={{ textShadow: "0 0 16px rgba(34,211,238,0.2)" }}
      >
        Related Articles
      </h2>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              className="group block overflow-hidden rounded-xl border border-white/[0.08] bg-[#050a14]/80 shadow-[0_0_20px_-8px_rgba(34,211,238,0.2)] transition hover:border-cyan-400/30"
            >
              <div className="relative aspect-[16/10] w-full bg-zinc-900">
                <Image
                  src={c.image.src}
                  alt={c.image.alt}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="space-y-1 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/90">
                  {c.category}
                </p>
                <h3 className="text-sm font-bold leading-snug text-white group-hover:text-cyan-100">
                  {c.title}
                </h3>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
