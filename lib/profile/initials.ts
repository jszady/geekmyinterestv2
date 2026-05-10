/** Two-letter initials for avatar fallbacks (username or email). */
export function profileInitials(displaySource: string | null | undefined): string {
  const raw = (displaySource ?? "").trim();
  if (!raw) return "GM";
  const cleaned = raw.replace(/^user_/i, "").replace(/[^a-zA-Z0-9]/g, "");
  if (cleaned.length >= 2) return cleaned.slice(0, 2).toUpperCase();
  if (cleaned.length === 1) return (cleaned + cleaned).toUpperCase();
  const fromEmail = raw.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "") ?? "";
  if (fromEmail.length >= 2) return fromEmail.slice(0, 2).toUpperCase();
  if (fromEmail.length === 1) return (fromEmail + fromEmail).toUpperCase();
  return "GM";
}
