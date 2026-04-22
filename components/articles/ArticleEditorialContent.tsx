import type { PostRow } from "@/lib/database.types";
import { postImagePublicUrl } from "@/lib/posts/image-url";
import {
  postHasEditorialSections,
  postSectionIndices,
} from "@/lib/posts/section-fields";
import Image from "next/image";

type Props = { post: PostRow };

/**
 * Renders sections 1–15 (text → image per section) or legacy body_part / inline_image.
 */
export async function ArticleEditorialContent({ post }: Props) {
  if (postHasEditorialSections(post as Record<string, unknown>)) {
    return <EditorialSections post={post} />;
  }
  return <LegacyArticleBody post={post} />;
}

async function EditorialSections({ post }: Props) {
  const p = post as Record<string, unknown>;
  const chunks: React.ReactNode[] = [];

  for (const n of postSectionIndices()) {
    const t = p[`section_${n}_text`];
    const i = p[`section_${n}_image`];
    const textStr = typeof t === "string" && t.trim() ? t : null;
    const imgPath = typeof i === "string" && i.trim() ? i.trim() : null;
    if (!textStr && !imgPath) continue;

    const imgUrl = imgPath ? await postImagePublicUrl(imgPath) : null;

    chunks.push(
      <section
        key={n}
        data-article-section={n}
        className="mt-10 space-y-6 border-t border-white/[0.06] pt-10 first:mt-8 first:border-0 first:pt-0"
      >
        {textStr ? (
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-200">
              {textStr}
            </p>
          </div>
        ) : null}
        {imgUrl ? (
          <div
            className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900"
            data-article-section-image={n}
          >
            <Image
              src={imgUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        ) : null}
      </section>,
    );
  }

  return <div data-article-mode="editorial">{chunks}</div>;
}

async function LegacyArticleBody({ post }: Props) {
  const inlineUrl = post.inline_image
    ? await postImagePublicUrl(post.inline_image)
    : null;

  return (
    <div data-article-mode="legacy">
      {post.body_part_1 ? (
        <div className="prose prose-invert mt-10 max-w-none" data-legacy-part="body1">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-200">
            {post.body_part_1}
          </p>
        </div>
      ) : null}

      {inlineUrl ? (
        <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900">
          <Image
            src={inlineUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
      ) : null}

      {post.body_part_2 ? (
        <div className="prose prose-invert mt-10 max-w-none" data-legacy-part="body2">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-200">
            {post.body_part_2}
          </p>
        </div>
      ) : null}
    </div>
  );
}
