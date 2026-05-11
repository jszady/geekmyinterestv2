"use client";

import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useState } from "react";

const TOOLBAR_BTN =
  "rounded border border-white/15 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-zinc-200 transition hover:border-cyan-400/40 hover:text-cyan-100";
const TOOLBAR_BTN_ACTIVE =
  "border-cyan-400/55 bg-cyan-500/15 text-cyan-100";

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Convert plain-text legacy content to HTML for loading into Tiptap.
 * - Double newline → new <p> (paragraph spacing)
 * - Single newline → <br> (tight line break)
 * If the value is already HTML, return as-is.
 */
function asHtmlValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  const blocks = trimmed.split(/\n(?:\s*\n)+/).map((b) => b.trim()).filter(Boolean);
  if (blocks.length === 0) return "";
  return blocks
    .map((block) => {
      const inner = block.split(/\n/).map((line) => escapeHtmlText(line)).join("<br>");
      return `<p>${inner}</p>`;
    })
    .join("");
}

type Props = {
  name: string;
  id: string;
  defaultValue: string;
  placeholder?: string;
  minHeightClass?: string;
};

export function AdminRichTextEditor({
  name,
  id,
  defaultValue,
  placeholder = "Write here...",
  minHeightClass = "min-h-[180px]",
}: Props) {
  const [html, setHtml] = useState<string>(asHtmlValue(defaultValue));

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        // HardBreak is included in StarterKit: Shift+Enter inserts <br>
        // Default Enter behaviour: new paragraph
      }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
      }),
      Image.configure({ inline: true }),
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: asHtmlValue(defaultValue),
    editorProps: {
      attributes: {
        class:
          "article-rich-body max-w-none focus:outline-none text-sm text-zinc-100 leading-relaxed",
      },
    },
    onUpdate: ({ editor: ed }) => {
      setHtml(ed.getHTML());
    },
  });

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", previousUrl ?? "");
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: trimmed }).run();
  };

  const addImage = () => {
    if (!editor) return;
    const src = window.prompt("Image URL");
    if (!src) return;
    const trimmed = src.trim();
    if (!trimmed) return;
    editor.chain().focus().setImage({ src: trimmed }).run();
  };

  const currentColor = (editor?.getAttributes("textStyle").color as string | undefined) ?? "#ffffff";

  return (
    <div className="mt-1 rounded-lg border border-white/10 bg-[#050a14]">
      <input type="hidden" id={id} name={name} value={html} />

      <p className="border-b border-white/10 px-2 py-1.5 text-[11px] text-zinc-500">
        <span className="text-zinc-400">Shift+Enter</span> tight line break ·{" "}
        <span className="text-zinc-400">Enter</span> new paragraph.
      </p>
      <div className="flex flex-wrap gap-1 border-b border-white/10 p-2">
        <button
          type="button"
          className={`${TOOLBAR_BTN} ${editor?.isActive("bold") ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BTN} italic ${editor?.isActive("italic") ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BTN} underline ${editor?.isActive("underline") ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          U
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BTN} ${editor?.isActive("heading", { level: 2 }) ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BTN} ${editor?.isActive("heading", { level: 3 }) ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BTN} ${editor?.isActive("bulletList") ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          Bullets
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BTN} ${editor?.isActive("orderedList") ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          Numbered
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BTN} ${editor?.isActive("blockquote") ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BTN} ${editor?.isActive("codeBlock") ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          Code
        </button>
        <button
          type="button"
          className={`${TOOLBAR_BTN} ${editor?.isActive("link") ? TOOLBAR_BTN_ACTIVE : ""}`}
          onClick={setLink}
        >
          Link
        </button>
        <button type="button" className={TOOLBAR_BTN} onClick={addImage}>
          Image
        </button>
        <button type="button" className={TOOLBAR_BTN} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
          Left
        </button>
        <button type="button" className={TOOLBAR_BTN} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
          Center
        </button>
        <button type="button" className={TOOLBAR_BTN} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
          Right
        </button>
        <label className="ml-1 flex items-center gap-1 text-xs text-zinc-400">
          Color
          <input
            type="color"
            value={currentColor}
            className="h-7 w-7 rounded border border-white/15 bg-transparent p-0"
            onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
          />
        </label>
      </div>

      <div className={`px-3 py-2 ${minHeightClass}`}>
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="text-sm text-zinc-500">{placeholder}</div>
        )}
      </div>
    </div>
  );
}
