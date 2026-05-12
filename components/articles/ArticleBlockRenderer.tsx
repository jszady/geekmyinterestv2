import { sanitizeRichHtml } from "@/lib/content/sanitize-rich-html";
import { postImagePublicUrl } from "@/lib/posts/image-url";
import type { ContentBlock } from "@/lib/posts/content-blocks";
import { SectionVideoEmbed } from "@/components/articles/SectionVideoEmbed";
import Image from "next/image";

type Props = { blocks: ContentBlock[] };

const imageFrame =
  "relative mx-auto w-full max-w-full overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] aspect-[4/3]";

function spacerClass(size: "sm" | "md" | "lg"): string {
  if (size === "sm") return "h-4";
  if (size === "md") return "h-8";
  return "h-16";
}

/**
 * Renders V2 `posts.content_blocks` on public article and admin preview.
 */
export async function ArticleBlockRenderer({ blocks }: Props) {
  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  const chunks: React.ReactNode[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i]!;

    switch (b.type) {
      case "text":
        chunks.push(
          <div
            key={b.id}
            className="article-rich-body max-w-none text-zinc-200 first:mt-0 mt-8"
            data-block-type="text"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(b.data.html) }}
          />,
        );
        break;

      case "image": {
        const url = await postImagePublicUrl(b.data.storagePath);
        if (url) {
          chunks.push(
            <figure key={b.id} className="mt-8 space-y-2" data-block-type="image">
              <div className={imageFrame}>
                <Image
                  src={url}
                  alt={b.data.caption || ""}
                  fill
                  className="h-full w-full object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 720px"
                />
              </div>
              {b.data.caption ? (
                <figcaption className="text-center text-sm text-zinc-500">{b.data.caption}</figcaption>
              ) : null}
            </figure>,
          );
        }
        break;
      }

      case "youtube":
        chunks.push(
          <div key={b.id} className="mt-8 w-full min-w-0" data-block-type="youtube">
            <SectionVideoEmbed url={b.data.url} sectionIndex={i + 1} />
          </div>,
        );
        break;

      case "divider":
        chunks.push(
          <hr
            key={b.id}
            className="my-10 border-0 border-t border-white/[0.08]"
            data-block-type="divider"
          />,
        );
        break;

      case "spacer":
        chunks.push(
          <div
            key={b.id}
            className={`${spacerClass(b.data.size)} w-full shrink-0`}
            aria-hidden
            data-block-type="spacer"
          />,
        );
        break;

      default:
        break;
    }
  }

  return (
    <div data-article-mode="blocks-v2" className="min-w-0">
      {chunks}
    </div>
  );
}
