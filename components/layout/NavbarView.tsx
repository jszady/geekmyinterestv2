import { signOutAction } from "@/app/auth/actions";
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#latest-heading", label: "Latest" },
] as const;

const joinCtaBase =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-cyan-400/45 bg-gradient-to-r from-cyan-500/12 to-violet-500/12 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_-6px_rgba(34,211,238,0.4)] transition hover:border-cyan-300/60 hover:shadow-[0_0_36px_-4px_rgba(34,211,238,0.5)]";

export type NavbarViewProps = {
  signedIn: boolean;
  username: string;
  isAdmin: boolean;
};

/**
 * Presentational navbar — session resolution happens in `Navbar`.
 */
export function NavbarView({ signedIn, username, isAdmin }: NavbarViewProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-30 border-b border-white/[0.05] bg-gradient-to-b from-[#02040d]/85 via-[#02040d]/35 to-transparent px-5 py-4 backdrop-blur-md sm:px-8 lg:px-12 xl:px-16">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:gap-8">
        <div className="flex items-center justify-between gap-4 sm:justify-start lg:w-auto">
          <Link
            href="/"
            className="flex shrink-0 items-center transition-opacity hover:opacity-90"
          >
            <Image
              src="/images/logo/logo.png"
              alt="Geek My Interest"
              width={2291}
              height={1134}
              className="h-11 w-auto object-contain object-left sm:h-12 md:h-[3.25rem] lg:h-14 xl:h-16"
              sizes="(max-width: 640px) 200px, (max-width: 768px) 240px, (max-width: 1024px) 280px, 320px"
              priority
            />
          </Link>
          {!signedIn ? (
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                data-testid="nav-login"
                href="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-cyan-400/35"
              >
                Log in
              </Link>
              <Link
                data-testid="nav-signup"
                href="/signup"
                className={`${joinCtaBase} px-4 py-2 text-sm`}
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div className="flex max-w-[55vw] items-center gap-2 sm:hidden">
              <span data-testid="nav-username" className="truncate text-xs text-zinc-400">
                {username}
              </span>
              <form action={signOutAction}>
                <button
                  data-testid="nav-logout"
                  type="submit"
                  className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-100"
                >
                  Out
                </button>
              </form>
            </div>
          )}
        </div>

        <nav
          aria-label="Primary"
          className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm font-medium text-zinc-400 sm:flex-1 sm:justify-center lg:gap-x-10"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="transition-colors hover:text-cyan-200/95"
            >
              {label}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              data-testid="nav-admin"
              href="/admin"
              className="font-semibold text-fuchsia-200/90 transition-colors hover:text-fuchsia-100"
            >
              Admin
            </Link>
          ) : null}
        </nav>

        <div className="hidden items-center justify-end gap-3 sm:flex sm:w-auto lg:min-w-[10rem]">
          {!signedIn ? (
            <>
              <Link
                data-testid="nav-login-desktop"
                href="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-cyan-400/35"
              >
                Log in
              </Link>
              <Link data-testid="nav-signup-desktop" href="/signup" className={joinCtaBase}>
                Sign up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span
                data-testid="nav-username-desktop"
                className="max-w-[10rem] truncate text-right text-xs text-zinc-400 sm:text-sm"
              >
                {username}
              </span>
              <form action={signOutAction}>
                <button
                  data-testid="nav-logout-desktop"
                  type="submit"
                  className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/35 hover:text-white"
                >
                  Log out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
