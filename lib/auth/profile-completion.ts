export function isUsernameIncomplete(username: string | null | undefined): boolean {
  const u = username?.trim() ?? "";
  return !u || u.startsWith("user_");
}

