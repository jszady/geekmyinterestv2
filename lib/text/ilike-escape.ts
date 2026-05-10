/** Escape `%`, `_`, and `\` for safe use inside Postgres `ILIKE` patterns. */
export function escapeIlikePattern(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
