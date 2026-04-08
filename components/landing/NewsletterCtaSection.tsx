import Image from "next/image";
import { SocialIcons } from "./SocialIcons";
import { SubscribeForm } from "./SubscribeForm";

const MASCOT = "/images/hero/herov2.png";

export function NewsletterCtaSection() {
  return (
    <section
      className="relative z-10 border-t border-white/[0.08] bg-gradient-to-b from-[#030814]/95 via-[#02040d] to-[#010208] py-16 sm:py-20 lg:py-24"
      aria-labelledby="newsletter-cta-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,rgba(139,92,246,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_30%,rgba(34,211,238,0.06),transparent_50%)]" />

      <div className="relative mx-auto w-full max-w-[1800px] px-5 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)] lg:gap-14 xl:gap-20">
          <div className="max-w-xl space-y-6 lg:max-w-2xl">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-400/75">
                Newsletter
              </p>
              <h2
                id="newsletter-cta-heading"
                className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                Join the Geek Community
              </h2>
              <p className="text-base leading-relaxed text-zinc-400 sm:text-lg">
                Get weekly picks, deep dives, and the stories worth your
                attention — straight to your inbox. No spam, just geek culture
                done right.
              </p>
            </div>

            <SubscribeForm />

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Follow along
              </p>
              <SocialIcons />
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[220px] justify-center sm:max-w-[260px] lg:mx-0 lg:max-w-[280px]">
            <div
              className="pointer-events-none absolute inset-[-20%] rounded-full bg-[radial-gradient(circle_at_50%_55%,rgba(56,189,248,0.12),rgba(124,58,237,0.06)_45%,transparent_65%)] blur-2xl"
              aria-hidden
            />
            <Image
              src={MASCOT}
              alt="Geek My Interest mascot"
              width={1133}
              height={1474}
              className="relative h-auto w-full object-contain opacity-95 animate-float-slow"
              sizes="(max-width: 1024px) 260px, 280px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
