import type { PostRow } from "@/lib/database.types";
import { SectionVideoEmbed } from "@/components/articles/SectionVideoEmbed";
import { postImagePublicUrl } from "@/lib/posts/image-url";
import {
  postHasEditorialSections,
  postSectionIndices,
} from "@/lib/posts/section-fields";
import { looksLikeHtml, sanitizeRichHtml } from "@/lib/content/sanitize-rich-html";
import { renderSectionTextWithMarkdown } from "@/lib/posts/section-text-markdown";
import Image from "next/image";

type Props = { post: PostRow };

/** Section/body imagery: 4:3 matches common 1200×900 uploads; image fills frame. */
const articleSectionMediaFrame =
  "relative mx-auto w-full max-w-full overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]";

const articleSectionAspect = "aspect-[4/3] w-full";

/**
 * Renders sections 1–15 (text → image → video per section) or legacy body_part / inline_image.
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
    const it = p[`section_${n}_image_top`];
    const vt = p[`section_${n}_video_url_top`];
    const i = p[`section_${n}_image`];
    const v = p[`section_${n}_video_url`];
    const textStr = typeof t === "string" && t.trim() ? t : null;
    const topImgPath = typeof it === "string" && it.trim() ? it.trim() : null;
    const topVideoRaw = typeof vt === "string" && vt.trim() ? vt.trim() : null;
    const imgPath = typeof i === "string" && i.trim() ? i.trim() : null;
    const videoRaw = typeof v === "string" && v.trim() ? v.trim() : null;
    if (!textStr && !topImgPath && !topVideoRaw && !imgPath && !videoRaw) continue;

    const topImgUrl = topImgPath ? await postImagePublicUrl(topImgPath) : null;
    const imgUrl = imgPath ? await postImagePublicUrl(imgPath) : null;

    chunks.push(
      <section
        key={n}
        data-article-section={n}
        className="mt-10 space-y-6 border-t border-white/[0.06] pt-10 first:mt-8 first:border-0 first:pt-0"
      >
        {topImgUrl ? (
          <div
            className={`${articleSectionMediaFrame} ${articleSectionAspect}`}
            data-article-section-image-top={n}
          >
            <Image
              src={topImgUrl}
              alt=""
              fill
              className="h-full w-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        ) : null}
        {topVideoRaw ? <SectionVideoEmbed url={topVideoRaw} sectionIndex={n} /> : null}
        {textStr ? (
          looksLikeHtml(textStr) ? (
            <div
              className="article-rich-body max-w-none"
              data-article-rich-text={n}
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(textStr) }}
            />
          ) : (
            <div className="max-w-none text-base leading-relaxed text-zinc-200">
              <p className="whitespace-pre-wrap">{renderSectionTextWithMarkdown(textStr)}</p>
            </div>
          )
        ) : null}
        {imgUrl ? (
          <div
            className={`${articleSectionMediaFrame} ${articleSectionAspect}`}
            data-article-section-image={n}
          >
            <Image
              src={imgUrl}
              alt=""
              fill
              className="h-full w-full object-cover object-center"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        ) : null}
        {videoRaw ? <SectionVideoEmbed url={videoRaw} sectionIndex={n} /> : null}
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
        <div className="mt-10 max-w-none" data-legacy-part="body1">
          {looksLikeHtml(post.body_part_1) ? (
            <div
              className="article-rich-body max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.body_part_1) }}
            />
          ) : (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-200">
              {post.body_part_1}
            </p>
          )}
        </div>
      ) : null}

      {inlineUrl ? (
        <div
          className={`${articleSectionMediaFrame} ${articleSectionAspect} mt-10`}
        >
          <Image
            src={inlineUrl}
            alt={post.title}
            fill
            className="h-full w-full object-cover object-center"
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
      ) : null}

      {post.body_part_2 ? (
        <div className="mt-10 max-w-none" data-legacy-part="body2">
          {looksLikeHtml(post.body_part_2) ? (
            <div
              className="article-rich-body max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(post.body_part_2) }}
            />
          ) : (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-zinc-200">
              {post.body_part_2}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
