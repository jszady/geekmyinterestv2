import { createServerClient } from "@supabase/ssr";
import { ensureProfileRowForUser } from "@/lib/auth/ensure-profile";
import { isUsernameIncomplete } from "@/lib/auth/profile-completion";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { requireSupabasePublicEnvForServer } from "@/lib/supabase/public-env";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next");
  const nextPath = safeRedirect(nextRaw, url.origin);

  if (!code) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const cookieStore = await cookies();
  let supabaseUrl: string;
  let anon: string;
  try {
    ({ url: supabaseUrl, anonKey: anon } = requireSupabasePublicEnvForServer());
  } catch {
    return NextResponse.json(
      { error: "Missing Supabase environment variables" },
      { status: 500 },
    );
  }

  const supabase = createServerClient(supabaseUrl, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback]", error.message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const ensured = await ensureProfileRowForUser(supabase, user);
    if (!ensured.ok && ensured.reason === "email_conflict") {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(
          "/login?error=" +
            encodeURIComponent(
              "An account with this email already exists. Please use your existing login method.",
            ),
          url.origin,
        ),
      );
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    if (isUsernameIncomplete(profile?.username)) {
      return NextResponse.redirect(new URL("/complete-profile", url.origin));
    }
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
