/** Two-letter initials for avatar fallbacks (username or email). */
export function profileInitials(displaySource: string | null | undefined): string {
  const raw = (displaySource ?? "").trim();
  if (!raw) return "GM";
  const withoutFallbackPrefix = raw.replace(/^user_/i, "").trim();
  const parts = withoutFallbackPrefix.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.match(/[a-zA-Z0-9]/)?.[0] ?? "";
    const b = parts[1]?.match(/[a-zA-Z0-9]/)?.[0] ?? "";
    if (a && b) return (a + b).toUpperCase();
  }
  const cleaned = withoutFallbackPrefix.replace(/[^a-zA-Z0-9]/g, "");
  if (cleaned.length >= 2) return cleaned.slice(0, 2).toUpperCase();
  if (cleaned.length === 1) return (cleaned + cleaned).toUpperCase();
  const fromEmail = raw.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "") ?? "";
  if (fromEmail.length >= 2) return fromEmail.slice(0, 2).toUpperCase();
  if (fromEmail.length === 1) return (fromEmail + fromEmail).toUpperCase();
  return "GM";
}
