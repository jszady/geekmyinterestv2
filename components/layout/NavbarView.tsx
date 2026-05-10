"use client";

import { signOutAction } from "@/app/auth/actions";
import { NavbarBlogSearch } from "@/components/layout/NavbarBlogSearch";
import { NavbarMobileMenu } from "@/components/layout/NavbarMobileMenu";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { OFFICIAL_LINKS } from "@/lib/social/official-links";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** TODO: Re-enable newsletter/subscribe nav CTA after newsletter system is implemented. */

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#latest-heading", label: "Latest" },
  { href: "/podcast", label: "Podcast" },
  { href: "/contact", label: "Contact" },
] as const;

const joinCtaBase =
  "inline-flex shrink-0 items-center justify-center rounded-md border border-cyan-400/35 bg-gradient-to-r from-cyan-500/12 to-violet-500/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-cyan-300/60";

export type NavbarViewProps = {
  signedIn: boolean;
  username: string;
  avatarUrl: string | null;
  isAdmin: boolean;
};

function IconX() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path
        fill="currentColor"
        d="M18.9 2H22l-6.77 7.74L23.2 22H16.9l-4.93-6.82L5.96 22H2.84l7.25-8.3L.8 2h6.45l4.45 6.18L18.9 2Zm-1.1 18h1.73L6.32 3.9H4.47L17.8 20Z"
      />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path
        fill="currentColor"
        d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.75A4 4 0 0 0 3.75 7.75v8.5a4 4 0 0 0 4 4h8.5a4 4 0 0 0 4-4v-8.5a4 4 0 0 0-4-4h-8.5Zm8.87 1.5a1.13 1.13 0 1 1 0 2.26 1.13 1.13 0 0 1 0-2.26ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.75a3.25 3.25 0 1 0 0 6.5 3.25 3.25 0 0 0 0-6.5Z"
      />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path
        fill="currentColor"
        d="M23.5 7.1a3.2 3.2 0 0 0-2.25-2.27C19.2 4.25 12 4.25 12 4.25s-7.2 0-9.25.58A3.2 3.2 0 0 0 .5 7.1 33.6 33.6 0 0 0 0 12a33.6 33.6 0 0 0 .5 4.9 3.2 3.2 0 0 0 2.25 2.27c2.05.58 9.25.58 9.25.58s7.2 0 9.25-.58a3.2 3.2 0 0 0 2.25-2.27A33.6 33.6 0 0 0 24 12a33.6 33.6 0 0 0-.5-4.9ZM9.6 15.3V8.7L15.8 12l-6.2 3.3Z"
      />
    </svg>
  );
}

function CompactHeader({
  links,
  signedIn,
  username,
  avatarUrl,
  sticky,
  className,
}: {
  links: readonly { href: string; label: string }[];
  signedIn: boolean;
  username: string;
  avatarUrl: string | null;
  sticky?: boolean;
  className?: string;
}) {
  return (
    <div
      className={
        (sticky ? "sticky top-0 " : "") +
        (className ? className + " " : "") +
        "z-50 overflow-visible border-b border-white/[0.1] bg-[#02040d]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#02040d]/88"
      }
    >
      <div className="mx-auto flex min-h-[56px] w-full max-w-[1800px] items-center justify-between gap-3 px-4 py-2 sm:min-h-[60px] sm:px-6 md:h-14 md:min-h-0 md:py-0 lg:px-12 xl:px-16">
        <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6 lg:gap-8">
          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center transition-opacity hover:opacity-90"
          >
            <Image
              src="/images/logo/logo.png"
              alt="Geek My Interest"
              width={2291}
              height={1134}
              className="h-11 w-auto max-w-[min(100%,220px)] object-contain object-left sm:h-12 md:h-9 md:max-w-none"
              sizes="(max-width: 768px) 220px, 180px"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.16em] md:flex">
            {links.map(({ href, label }) => (
              <Link
                key={`compact-${label}`}
                href={href}
                className="text-zinc-300 transition-colors duration-200 hover:text-cyan-100"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {signedIn ? (
            <div className="hidden items-center gap-2 lg:flex">
              <UserAvatar username={username} avatarUrl={avatarUrl} size="xs" decorative />
              <span
                data-testid="nav-username-desktop"
                className="max-w-[11rem] truncate text-xs text-zinc-400"
              >
                {username}
              </span>
            </div>
          ) : null}
          {!signedIn ? (
            <>
              <Link
                data-testid="nav-login-desktop"
                href="/login"
                className="hidden rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-100 transition hover:border-cyan-400/35 md:inline-flex"
              >
                Log in
              </Link>
              <Link
                data-testid="nav-signup-desktop"
                href="/signup"
                className={"hidden md:inline-flex " + joinCtaBase}
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/account/settings"
                className="hidden rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-cyan-400/35 hover:text-cyan-100 md:inline-flex"
              >
                Account
              </Link>
              <form action={signOutAction} className="hidden md:block">
                <button
                  data-testid="nav-logout-desktop"
                  type="submit"
                  className="rounded-md border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-100 transition hover:border-cyan-400/35 hover:text-white"
                >
                  Log out
                </button>
              </form>
            </>
          )}
          <div className="flex items-center gap-2">
            <NavbarBlogSearch variant="popover" />
            <NavbarMobileMenu
              links={links}
              signedIn={signedIn}
              username={username}
              avatarUrl={avatarUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Presentational navbar — session resolution happens in `Navbar`.
 */
export function NavbarView({ signedIn, username, avatarUrl, isAdmin }: NavbarViewProps) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [showCompact, setShowCompact] = useState(false);
  const links = isAdmin
    ? [...navLinks, { href: "/admin", label: "Admin" as const }]
    : navLinks;

  useEffect(() => {
    if (!isHomepage) return;
    const onScroll = () => setShowCompact(window.scrollY > 140);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomepage]);

  if (!isHomepage) {
    return (
      <CompactHeader
        links={links}
        signedIn={signedIn}
        username={username}
        avatarUrl={avatarUrl}
        sticky
      />
    );
  }

  return (
    <>
      <header className="relative z-30 overflow-visible border-b border-white/[0.06] bg-[#02040d]/96">
        <div className="mx-auto w-full max-w-[1800px] overflow-visible px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="hidden h-9 items-center justify-between border-b border-white/[0.06] text-zinc-500 md:flex">
            <div className="flex items-center gap-3">
              <a
                href={OFFICIAL_LINKS.x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Geek My Interest on X"
                className="transition-colors hover:text-cyan-300"
              >
                <IconX />
              </a>
              <a
                href={OFFICIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Geek My Interest on Instagram"
                className="transition-colors hover:text-fuchsia-300"
              >
                <IconInstagram />
              </a>
              <a
                href={OFFICIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Geek My Interest on YouTube"
                className="transition-colors hover:text-red-400"
              >
                <IconYouTube />
              </a>
            </div>
            <div className="flex items-center gap-3">
              {!signedIn ? (
                <>
                  <Link
                    data-testid="nav-login"
                    href="/login"
                    className="hidden rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-100 transition hover:border-cyan-400/35 md:inline-flex"
                  >
                    Log in
                  </Link>
                  <Link
                    data-testid="nav-signup"
                    href="/signup"
                    className={"hidden md:inline-flex " + joinCtaBase}
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  {isAdmin ? (
                    <Link
                      data-testid="nav-admin-topbar"
                      href="/admin"
                      className="hidden rounded-md border border-fuchsia-400/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-fuchsia-200 transition hover:border-fuchsia-300/55 md:inline-flex"
                    >
                      Admin
                    </Link>
                  ) : null}
                  <span className="hidden items-center gap-2 md:inline-flex">
                    <UserAvatar username={username} avatarUrl={avatarUrl} size="xs" decorative />
                    <span className="max-w-[11rem] truncate text-xs text-zinc-400">{username}</span>
                  </span>
                  <Link
                    href="/account/settings"
                    className="hidden rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-cyan-400/35 hover:text-cyan-100 md:inline-flex"
                  >
                    Account
                  </Link>
                  <form action={signOutAction} className="hidden md:block">
                    <button
                      data-testid="nav-logout"
                      type="submit"
                      className="rounded-md border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-100 transition hover:border-cyan-400/35 hover:text-white"
                    >
                      Log out
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          <div className="relative overflow-visible py-3 sm:py-5 md:py-7">
            <div className="sticky top-0 z-50 -mx-5 mb-3 border-b border-white/[0.1] bg-[#02040d]/95 px-5 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-[#02040d]/90 sm:-mx-8 sm:px-8 md:static md:z-auto md:mx-0 md:mb-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
              <div className="flex max-w-[1800px] items-center justify-between gap-3 md:hidden">
                <Link
                  href="/"
                  className="flex min-w-0 flex-1 shrink items-center transition-opacity hover:opacity-90"
                >
                  <Image
                    src="/images/logo/logo.png"
                    alt="Geek My Interest"
                    width={2291}
                    height={1134}
                    className="h-16 w-auto max-w-[min(100%,calc(100vw-10rem))] object-contain object-left sm:h-[4.75rem]"
                    sizes="(max-width: 430px) 280px, 320px"
                    priority
                  />
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <NavbarBlogSearch variant="popover" />
                  <NavbarMobileMenu
                    links={links}
                    signedIn={signedIn}
                    username={username}
                    avatarUrl={avatarUrl}
                    summaryTestId="nav-mobile-menu-home"
                    exposeAdminTestId={false}
                  />
                </div>
              </div>
            </div>

            <div className="hidden md:flex md:items-center md:justify-center md:px-2">
              <Link href="/" className="flex shrink-0 transition-opacity hover:opacity-90">
                <Image
                  src="/images/logo/logo.png"
                  alt="Geek My Interest"
                  width={2291}
                  height={1134}
                  className="h-[6.25rem] w-auto object-contain object-center lg:h-[7.25rem] xl:h-[8rem]"
                  sizes="(max-width: 1024px) 460px, 580px"
                  priority
                />
              </Link>
            </div>
          </div>

          <div className="relative hidden overflow-visible border-t border-white/[0.06] md:block">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 sm:gap-4 sm:py-3 lg:gap-6">
              <div className="min-w-0" aria-hidden />
              <nav
                aria-label="Primary"
                className="justify-self-center flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[0.78rem] font-bold uppercase tracking-[0.22em] sm:gap-x-7 lg:gap-x-12"
              >
                {links.map(({ href, label }) => (
                  <Link
                    key={label}
                    href={href}
                    className="relative shrink-0 text-zinc-300 transition-colors duration-200 hover:text-cyan-100 after:absolute after:-bottom-3 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-cyan-400/85 after:transition-transform after:duration-200 hover:after:scale-x-100"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="flex min-w-0 justify-end justify-self-end">
                <NavbarBlogSearch variant="inline" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <CompactHeader
        links={links}
        signedIn={signedIn}
        username={username}
        avatarUrl={avatarUrl}
        className={
          "fixed inset-x-0 top-0 transition-transform duration-200 " +
          (isHomepage && showCompact ? "translate-y-0" : "-translate-y-full")
        }
      />
    </>
  );
}
