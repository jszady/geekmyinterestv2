import Link from "next/link";
import type { ReactNode } from "react";

const MD_LINK = /\[([^\]]*)\]\(([^)]+)\)/g;

const linkClass =
  "font-medium text-cyan-200/95 underline decoration-cyan-400/40 decoration-1 underline-offset-[3px] transition hover:text-cyan-100 hover:decoration-cyan-300/70";

function isSafeInternalHref(href: string): boolean {
  const h = href.trim();
  if (!h || !h.startsWith("/") || h.startsWith("//")) return false;
  if (h.length > 2000) return false;
  const lower = h.toLowerCase();
  if (lower.includes("javascript:") || lower.includes("data:") || lower.includes("\\")) return false;
  if (/[<>]/.test(h)) return false;
  try {
    decodeURIComponent(h);
  } catch {
    return false;
  }
  return true;
}

function isSafeExternalHref(href: string): boolean {
  try {
    const u = new URL(href.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Renders `section_*_text` with only Markdown-style `[label](href)` turned into links.
 * All other text is plain (React-escaped). Unsafe or invalid hrefs are left as literal source.
 */
export function renderSectionTextWithMarkdown(source: string): ReactNode {
  if (!source) return null;
  const re = new RegExp(MD_LINK.source, MD_LINK.flags);
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(source)) !== null) {
    if (m.index > last) {
      out.push(source.slice(last, m.index));
    }
    const label = m[1];
    const href = m[2].trim();
    const display = label.length ? label : href;
    if (isSafeInternalHref(href)) {
      out.push(
        <Link key={`md-${key++}`} href={href} className={linkClass}>
          {display}
        </Link>,
      );
    } else if (isSafeExternalHref(href)) {
      out.push(
        <a
          key={`md-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {display}
        </a>,
      );
    } else {
      out.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < source.length) {
    out.push(source.slice(last));
  }
  if (out.length === 0) return source;
  if (out.length === 1) return out[0];
  return <>{out}</>;
}
