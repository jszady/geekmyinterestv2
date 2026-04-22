import type { ProfileRow } from "@/lib/database.types";

/** Normalize DB role (handles enum, extra spaces, casing). */
export function normalizeRole(
  role: ProfileRow["role"] | string | null | undefined,
): string | null {
  if (role == null) return null;
  const s = String(role).trim().toLowerCase();
  return s.length ? s : null;
}

export function isAdmin(profile: ProfileRow | null | undefined): boolean {
  return normalizeRole(profile?.role) === "admin";
}
