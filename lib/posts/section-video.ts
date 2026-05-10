/**
 * Parse pasted YouTube URLs into an 11-character video id for iframe embeds.
 * Supports watch, shorts, youtu.be, embed, and mobile hosts.
 */
export function parseYouTubeVideoId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;

  const host = u.hostname.replace(/^www\./i, "").toLowerCase();
  const idOk = (id: string) => /^[\w-]{11}$/.test(id);

  if (host === "youtu.be") {
    const id = u.pathname.replace(/^\//, "").split("/")[0] ?? "";
    return idOk(id) ? id : null;
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "www.youtube-nocookie.com"
  ) {
    if (u.pathname.startsWith("/shorts/")) {
      const id = u.pathname.slice("/shorts/".length).split("/")[0] ?? "";
      return idOk(id) ? id : null;
    }
    if (u.pathname.startsWith("/embed/")) {
      const id = u.pathname.slice("/embed/".length).split("/")[0] ?? "";
      return idOk(id) ? id : null;
    }
    const v = u.searchParams.get("v");
    if (v && idOk(v)) return v;
  }

  return null;
}

/** Only allow http(s) links for external “Watch clip” cards. */
export function safeHttpUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  return u.toString();
}
