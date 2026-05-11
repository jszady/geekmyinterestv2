"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/admin";
import {
  displayUsernameIlikePattern,
  normalizeDisplayUsername,
  validateDisplayUsername,
} from "@/lib/auth/display-username";
import { ensureProfileRowForUser } from "@/lib/auth/ensure-profile";
import {
  avatarFromSignupMetadata,
  parseSignupAvatarFromForm,
} from "@/lib/profile/signup-avatar";
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
    return { ok: false, error: validated.error, reason: "validation" };
  }
  const cleaned = validated.username;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const userIdPresent = Boolean(user?.id);
  if (authError || !user) {
    console.info("[complete-profile]", {
      userIdPresent,
      profileRowFound: null,
      path: "none",
      message: "no session user",
    });
    return { ok: false, error: "You must be logged in." };
  }

  const { data: selfProfile, error: selfProfileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selfProfileError) {
    console.error("[complete-profile] self profile select error", {
      code: selfProfileError.code,
      message: selfProfileError.message,
    });
    return { ok: false, error: selfProfileError.message };
  }

  const profileRowFound = Boolean(selfProfile?.id);

  const { data: existingRows, error: existingError } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", displayUsernameIlikePattern(cleaned))
    .neq("id", user.id)
    .limit(1);
  if (existingError) {
    console.error("[complete-profile] uniqueness check error", {
      code: existingError.code,
      message: existingError.message,
    });
    return { ok: false, error: existingError.message };
  }
  if ((existingRows ?? []).length > 0) {
    return {
      ok: false,
      error: "Username already taken",
      reason: "duplicate_username",
    };
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const avatarUrl =
    avatarFromSignupMetadata(meta) ?? parseSignupAvatarFromForm(formData);

  if (!profileRowFound) {
    console.info("[complete-profile]", {
      userIdPresent,
      profileRowFound: false,
      path: "insert",
      usernameLen: cleaned.length,
    });

    const insertRow = {
      id: user.id,
      email: user.email ?? null,
      username: cleaned,
      role: "user" as const,
      avatar_url: avatarUrl,
    };

    const { error: insertError } = await supabase.from("profiles").insert(insertRow);

    if (insertError) {
      console.error("[complete-profile] insert error", {
        code: insertError.code,
        message: insertError.message,
      });
      if (
        insertError.code === "23505" ||
        insertError.message.toLowerCase().includes("duplicate")
      ) {
        return {
          ok: false,
          error: "Username already taken",
          reason: "duplicate_username",
        };
      }
      return { ok: false, error: insertError.message };
    }
  } else {
    console.info("[complete-profile]", {
      userIdPresent,
      profileRowFound: true,
      path: "update",
      usernameLen: cleaned.length,
    });

    const { data: updatedRow, error: updateError } = await supabase
      .from("profiles")
      .update({ username: cleaned })
      .eq("id", user.id)
      .select("id, username")
      .maybeSingle();

    if (updateError) {
      console.error("[complete-profile] update error", {
        code: updateError.code,
        message: updateError.message,
      });
      if (
        updateError.message.toLowerCase().includes("duplicate") ||
        updateError.code === "23505"
      ) {
        return {
          ok: false,
          error: "Username already taken",
          reason: "duplicate_username",
        };
      }
      return { ok: false, error: updateError.message };
    }
    if (!updatedRow) {
      console.error("[complete-profile] update returned no row", {
        userId: user.id,
      });
      return {
        ok: false,
        error: "Could not update profile. Please try again.",
      };
    }
  }

  revalidatePath("/", "layout");
  revalidatePath("/complete-profile");
  return { ok: true, error: null, reason: null };
}
