import type { User, SupabaseClient } from "@supabase/supabase-js";
import { avatarFromSignupMetadata } from "@/lib/profile/signup-avatar";
import { DEFAULT_PROFILE_IMAGE_PATH } from "@/lib/profile/preset-avatars";

function fallbackUsername(userId: string): string {
  return `user_${userId.replace(/-/g, "").slice(0, 8).toLowerCase()}`;
}

export async function ensureProfileRowForUser(
  supabase: SupabaseClient,
  user: User,
): Promise<
  | { ok: true }
  | { ok: false; reason: "email_conflict"; existingProfileId: string }
  | { ok: false; reason: "error"; message: string }
> {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[profile ensure] select error", selectError);
    return { ok: false, reason: "error", message: selectError.message };
  }
  if (existing?.id) return { ok: true };

  if (user.email) {
    const { data: sameEmailRows, error: sameEmailError } = await supabase
      .from("profiles")
      .select("id,email")
      .ilike("email", user.email)
      .limit(1);

    if (sameEmailError) {
      console.error("[profile ensure] email lookup error", sameEmailError);
      return { ok: false, reason: "error", message: sameEmailError.message };
    }

    const sameEmail = (sameEmailRows ?? [])[0];
    if (sameEmail?.id && sameEmail.id !== user.id) {
      console.error("[profile ensure] email conflict", {
        authUserId: user.id,
        existingProfileId: sameEmail.id,
        email: user.email,
      });
      return {
        ok: false,
        reason: "email_conflict",
        existingProfileId: sameEmail.id,
      };
    }
  }

  const username = fallbackUsername(user.id);
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const payload = {
    id: user.id,
    email: user.email ?? null,
    username,
    role: "user",
    avatar_url: avatarFromSignupMetadata(meta) ?? DEFAULT_PROFILE_IMAGE_PATH,
  };

  const { error: insertError } = await supabase
    .from("profiles")
    .insert(payload);

  if (insertError) {
    console.error("[profile ensure] insert error", insertError, payload);
    if (
      insertError.code === "23505" ||
      insertError.message.toLowerCase().includes("duplicate")
    ) {
      if (user.email) {
        const { data: dupRows } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", user.email)
          .limit(1);
        const dup = (dupRows ?? [])[0];
        if (dup?.id && dup.id !== user.id) {
          return {
            ok: false,
            reason: "email_conflict",
            existingProfileId: dup.id,
          };
        }
      }
      return { ok: true };
    }
    return { ok: false, reason: "error", message: insertError.message };
  }

  return { ok: true };
}

