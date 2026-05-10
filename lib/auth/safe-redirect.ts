/**
 * Sanitize post-login `next` query values: only same-origin paths are allowed.
 */
export function safeRedirect(next: string | null, origin: string): string {
  if (!next) return "/";
  try {
    const resolved = new URL(next, origin);
    if (resolved.origin !== origin) return "/";
    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return "/";
  }
}
