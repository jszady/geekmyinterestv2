import type { ProfileRow } from "@/lib/database.types";
import { isAdmin } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/session";

export type AdminGateResult =
  | { ok: true; session: SessionUser }
  | { ok: false; session: SessionUser | null; reason: "unauthenticated" | "no_profile" | "not_admin" };

/**
 * Single place for “can access /admin” — same rules as navbar Admin link.
 */
export function evaluateAdminGate(session: SessionUser | null): AdminGateResult {
  if (!session?.user) {
    return { ok: false, session: null, reason: "unauthenticated" };
  }
  if (!session.profile) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[admin-gate] no profile row for user", session.user.id);
    }
    return { ok: false, session, reason: "no_profile" };
  }
  const admin = isAdmin(session.profile);
  if (process.env.NODE_ENV === "development") {
    console.log("[admin-gate]", {
      authUserId: session.user.id,
      profileId: session.profile.id,
      role: (session.profile as ProfileRow).role,
      adminCheckPassed: admin,
    });
  }
  if (!admin) {
    return { ok: false, session, reason: "not_admin" };
  }
  return { ok: true, session };
}
