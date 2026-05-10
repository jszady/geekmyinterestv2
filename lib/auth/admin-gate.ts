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
    return { ok: false, session, reason: "no_profile" };
  }
  const admin = isAdmin(session.profile);
  if (!admin) {
    return { ok: false, session, reason: "not_admin" };
  }
  return { ok: true, session };
}
