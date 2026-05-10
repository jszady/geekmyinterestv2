import type { User } from "@supabase/supabase-js";

/** True if the user can sign in with email + password (not OAuth-only). */
export function userHasEmailPasswordIdentity(user: User | null | undefined): boolean {
  if (!user?.identities?.length) return false;
  return user.identities.some((i) => i.provider === "email");
}
