import { createServerClient } from "@supabase/ssr";
import { isUsernameIncomplete } from "@/lib/auth/profile-completion";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: read only `NEXT_PUBLIC_*` (no `loadEnvConfig` / fs — not available on Edge).
 * Values are injected by Next at dev/build time from `.env.local`.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  const authShellPaths = new Set([
    "/complete-profile",
    "/login",
    "/signup",
    "/forgot-password",
    "/update-password",
  ]);
  const allowWhenIncomplete =
    authShellPaths.has(pathname) || pathname.startsWith("/auth/");

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return response;
  }

  const username = profileRow?.username ?? null;
  const needsCompletion = isUsernameIncomplete(username);

  if (needsCompletion && !allowWhenIncomplete) {
    const target = request.nextUrl.clone();
    target.pathname = "/complete-profile";
    target.search = "";
    return NextResponse.redirect(target);
  }

  if (!needsCompletion && pathname === "/complete-profile") {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.search = "";
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
