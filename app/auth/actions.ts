"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import {
  displayUsernameIlikePattern,
  normalizeDisplayUsername,
  validateDisplayUsername,
} from "@/lib/auth/display-username";
import { ensureProfileRowForUser } from "@/lib/auth/ensure-profile";
import { parseSignupAvatarFromForm } from "@/lib/profile/signup-avatar";
import { uploadProfileAvatarForNewUser } from "@/lib/profile/signup-storage-avatar";
import { revalidatePath } from "next/cache";
import { getPublicSiteUrl } from "@/lib/site-public-url";
import { redirect } from "next/navigation";

export type AuthActionState = {
  ok: boolean;
  error: string | null;
  reason?: "duplicate_email" | "duplicate_username" | "validation" | null;
};

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const submittedUsername = String(formData.get("username") ?? "");
  const normalizedUsername = normalizeDisplayUsername(submittedUsername);
  const usernameCheck = validateDisplayUsername(normalizedUsername);
  if (!usernameCheck.ok) {
    return {
      ok: false,
      error: usernameCheck.error,
      reason: "validation",
    };
  }
  const username = usernameCheck.username;

  if (!email || !password) {
    return {
      ok: false,
      error: "Email and password are required.",
      reason: "validation",
    };
  }

  const supabase = await createSupabaseServerClient();

  const { data: takenUsernameRows, error: usernameCheckError } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", displayUsernameIlikePattern(username))
    .limit(1);
  if (usernameCheckError) {
    console.error("[signup] username check error:", usernameCheckError);
    return {
      ok: false,
      error: "Could not validate username. Please try again.",
      reason: "validation",
    };
  }
  if ((takenUsernameRows ?? []).length > 0) {
    return {
      ok: false,
      error: "Username already taken.",
      reason: "duplicate_username",
    };
  }

  const { data: existingEmailRows, error: emailCheckError } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .limit(1);
  if (emailCheckError) {
    console.error("[signup] email check error:", emailCheckError);
  } else if ((existingEmailRows ?? []).length > 0) {
    return {
      ok: false,
      error: "An account with this email already exists. Please log in.",
      reason: "duplicate_email",
    };
  }

  const signupAvatarPath = parseSignupAvatarFromForm(formData);

  const origin = getPublicSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        signup_avatar_url: signupAvatarPath,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) {
    const m = error.message.toLowerCase();
    if (
      m.includes("already registered") ||
      m.includes("already exists") ||
      m.includes("duplicate") ||
      error.code === "user_already_exists"
    ) {
      return {
        ok: false,
        error: "An account with this email already exists. Please log in.",
        reason: "duplicate_email",
      };
    }
    return {
      ok: false,
      error: "Could not create your account. Please try again.",
      reason: "validation",
    };
  }

  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return {
      ok: false,
      error: "An account with this email already exists. Please log in.",
      reason: "duplicate_email",
    };
  }

  if (data.user) {
    let finalAvatarUrl = signupAvatarPath;
    const signupAvatarFile = formData.get("signup_avatar_file");

    if (signupAvatarFile instanceof File && signupAvatarFile.size > 0) {
      try {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
        if (serviceKey) {
          const admin = createSupabaseServiceRoleClient();
          const up = await uploadProfileAvatarForNewUser(admin, data.user.id, signupAvatarFile);
          if (up.ok) finalAvatarUrl = up.publicUrl;
          else console.error("[signup] avatar file upload (service role)", up.error);
        } else if (data.session) {
          const up = await uploadProfileAvatarForNewUser(supabase, data.user.id, signupAvatarFile);
          if (up.ok) finalAvatarUrl = up.publicUrl;
          else console.error("[signup] avatar file upload (session)", up.error);
        } else {
          console.warn(
            "[signup] custom avatar file skipped: set SUPABASE_SERVICE_ROLE_KEY for email-confirmation signups, or use a preset.",
          );
        }
      } catch (e) {
        console.error("[signup] avatar file upload failed", e);
      }
    }

    const profileRow = {
      id: data.user.id,
      email,
      username,
      role: "user" as const,
      avatar_url: finalAvatarUrl,
    };
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      if (serviceKey) {
        const admin = createSupabaseServiceRoleClient();
        const { error: upErr } = await admin
          .from("profiles")
          .upsert(profileRow, { onConflict: "id" });
        if (upErr) {
          console.error("[signup] profile upsert (service role)", upErr.message);
        }
      } else if (data.session) {
        const { error: upErr } = await supabase
          .from("profiles")
          .upsert(profileRow, { onConflict: "id" });
        if (upErr) {
          console.error("[signup] profile upsert (session)", upErr.message);
        }
      }
    } catch (e) {
      console.error("[signup] profile upsert failed", e);
    }

    if (data.session && finalAvatarUrl !== signupAvatarPath) {
      try {
        const { error: metaErr } = await supabase.auth.updateUser({
          data: { signup_avatar_url: finalAvatarUrl },
        });
        if (metaErr) console.warn("[signup] updateUser metadata", metaErr.message);
      } catch (e) {
        console.warn("[signup] updateUser metadata failed", e);
      }
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, error: null, reason: null };
}

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[login]", error.message);
    return { ok: false, error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const ensured = await ensureProfileRowForUser(supabase, user);
    if (!ensured.ok && ensured.reason === "email_conflict") {
      await supabase.auth.signOut();
      return {
        ok: false,
        error:
          "An account with this email already exists. Please use your existing login method.",
      };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, error: null };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[logout]", error.message);
    throw new Error(error.message);
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function completeProfileAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const submitted = String(formData.get("username") ?? "");
  const normalized = normalizeDisplayUsername(submitted);
  const validated = validateDisplayUsername(normalized);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }
  const cleaned = validated.username;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "You must be logged in." };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", displayUsernameIlikePattern(cleaned))
    .neq("id", user.id)
    .limit(1);
  if (existingError) {
    console.error("[complete-profile] uniqueness check error", existingError);
    return { ok: false, error: existingError.message };
  }
  if ((existingRows ?? []).length > 0) {
    return { ok: false, error: "Username already taken" };
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from("profiles")
    .update({ username: cleaned })
    .eq("id", user.id)
    .select("id, username")
    .maybeSingle();

  if (updateError) {
    console.error("[complete-profile] update error", updateError);
    if (
      updateError.message.toLowerCase().includes("duplicate") ||
      updateError.code === "23505"
    ) {
      return { ok: false, error: "Username already taken" };
    }
    return { ok: false, error: updateError.message };
  }
  if (!updatedRow) {
    console.error(
      "[complete-profile] update returned no row; possible missing profile row or RLS denial",
      { userId: user.id, cleanedUsername: cleaned },
    );
    return {
      ok: false,
      error:
        "Could not update profile. Please verify your profile row exists and RLS allows update.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true, error: null };
}
