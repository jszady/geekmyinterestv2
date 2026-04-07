import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "#", label: "Home" },
  { href: "#", label: "Content" },
  { href: "#", label: "Reviews" },
  { href: "#", label: "Shop" },
] as const;

const joinNowBase =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-cyan-400/45 bg-gradient-to-r from-cyan-500/12 to-violet-500/12 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_-6px_rgba(34,211,238,0.4)] transition hover:border-cyan-300/60 hover:shadow-[0_0_36px_-4px_rgba(34,211,238,0.5)]";

function JoinNowLink({ className = "" }: { className?: string }) {
  return (
    <Link href="#" className={`${joinNowBase} ${className}`.trim()}>
      Join Now
    </Link>
  );
}

export function Navbar() {
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
          <JoinNowLink className="sm:hidden" />
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
        </nav>

        <div className="hidden justify-end sm:flex sm:w-auto lg:min-w-[8.5rem]">
          <JoinNowLink />
        </div>
      </div>
    </header>
  );
}
