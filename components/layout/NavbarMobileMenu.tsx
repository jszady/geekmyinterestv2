"use client";

import { signOutAction } from "@/app/auth/actions";
import { UserAvatar } from "@/components/profile/UserAvatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const joinCtaBase =
  "flex min-h-[48px] w-full items-center justify-center rounded-lg border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 text-sm font-bold uppercase tracking-wide text-white transition hover:border-cyan-300/55";

type NavLink = { href: string; label: string };

type Props = {
  links: readonly NavLink[];
  signedIn: boolean;
  username: string;
  avatarUrl: string | null;
  /** Optional test id for menu trigger */
  summaryTestId?: string;
  /** Duplicate menus exist on homepage (sticky + compact); only one should expose `nav-admin` for tests. */
  exposeAdminTestId?: boolean;
};

export function NavbarMobileMenu({
  links,
  signedIn,
  username,
  avatarUrl,
  summaryTestId = "nav-mobile-menu-trigger",
  exposeAdminTestId = true,
}: Props) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const el = detailsRef.current;
    if (el) el.open = false;
  }, [pathname]);

  return (
    <details
      ref={detailsRef}
      className="relative z-50 md:hidden"
      data-mobile-nav
    >
      <summary
        data-testid={summaryTestId}
        className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none rounded-lg border border-white/[0.14] bg-[#050a14]/90 px-4 py-3 text-sm font-bold uppercase tracking-wider text-zinc-100 shadow-[0_0_20px_-8px_rgba(34,211,238,0.25)] transition hover:border-cyan-400/40 hover:text-cyan-100 min-h-[48px] min-w-[48px] flex items-center justify-center gap-2"
      >
        <span className="flex flex-col gap-1" aria-hidden>
          <span className="block h-0.5 w-5 rounded-full bg-cyan-200/90" />
          <span className="block h-0.5 w-5 rounded-full bg-cyan-200/90" />
          <span className="block h-0.5 w-4 rounded-full bg-violet-300/80" />
        </span>
        Menu
      </summary>
      <div
        className="absolute right-0 z-[60] mt-2 w-[min(100vw-1.5rem,20rem)] max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain rounded-xl border border-cyan-400/20 bg-[#030711]/98 p-3 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.85),0_0_40px_-12px_rgba(34,211,238,0.15)] backdrop-blur-lg"
        role="navigation"
        aria-label="Mobile site"
      >
        <nav className="flex flex-col gap-1" aria-label="Primary pages">
          {links.map(({ href, label }) => (
            <Link
              key={`${href}-${label}`}
              href={href}
              data-testid={
                exposeAdminTestId && href === "/admin" && label === "Admin"
                  ? "nav-admin"
                  : undefined
              }
              className="rounded-lg px-4 py-3.5 text-base font-bold uppercase tracking-wide text-zinc-100 transition hover:bg-cyan-500/10 hover:text-cyan-100"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-3 border-t border-white/[0.08] pt-3">
          {signedIn ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2">
                <UserAvatar username={username} avatarUrl={avatarUrl} size="sm" decorative />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-300">
                  {username}
                </span>
              </div>
              <Link
                href="/account/settings"
                className="flex min-h-[48px] w-full items-center justify-center rounded-lg border border-white/12 bg-white/[0.05] text-sm font-bold uppercase tracking-wide text-zinc-100 transition hover:border-cyan-400/35"
              >
                Account
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  data-testid="nav-logout-mobile"
                  className="flex min-h-[48px] w-full items-center justify-center rounded-lg border border-white/12 bg-white/[0.04] text-sm font-bold uppercase tracking-wide text-zinc-100 transition hover:border-cyan-400/35"
                >
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                data-testid="nav-login-mobile"
                href="/login"
                className="flex min-h-[48px] w-full items-center justify-center rounded-lg border border-white/15 text-sm font-bold uppercase tracking-wide text-zinc-100 transition hover:border-cyan-400/35"
              >
                Log in
              </Link>
              <Link
                data-testid="nav-signup-mobile"
                href="/signup"
                className={joinCtaBase}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}
