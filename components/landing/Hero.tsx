import Image from "next/image";
import { SubscribeForm } from "./SubscribeForm";
import { SocialIcons } from "./SocialIcons";

const HERO_IMAGE = "/images/hero/herov2.png";

export function Hero() {
  return (
    <section className="relative z-10 grid min-h-dvh w-full grid-cols-1 lg:grid-cols-2 lg:grid-rows-1">
      <div className="flex max-w-xl flex-col justify-center gap-8 px-5 pb-12 pt-28 sm:px-8 lg:col-start-1 lg:row-start-1 lg:max-w-none lg:justify-self-start lg:px-12 lg:pb-20 lg:pt-32 xl:max-w-2xl xl:pl-16 2xl:pl-24">
        <div className="space-y-5">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.08] xl:text-[3.5rem]">
            Join the Geek Community
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-zinc-400 sm:text-xl">
            The latest in gaming, tech, reviews, and geek culture — built for
            fans who want depth, personality, and a place that actually gets it.
          </p>
        </div>

        <SubscribeForm />

        <SocialIcons />
      </div>

      <div className="relative flex w-full flex-col items-center justify-center px-5 pb-14 pt-10 sm:pb-16 lg:col-start-2 lg:row-start-1 lg:min-h-dvh lg:items-center lg:justify-center lg:px-10 lg:pb-20 lg:pt-32 xl:px-14 2xl:pr-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_48%_at_72%_58%,rgba(56,189,248,0.085),transparent_58%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-[#02040d]/45 via-transparent to-transparent lg:h-[40%]"
          aria-hidden
        />

        <div className="relative z-[1] w-full max-w-[280px] sm:max-w-[300px] lg:ml-auto lg:mr-8 lg:max-w-[360px] xl:mr-12 xl:max-w-[400px]">
          <div
            className="pointer-events-none absolute inset-[-14%] rounded-full bg-[radial-gradient(circle_at_50%_55%,rgba(56,189,248,0.14),rgba(124,58,237,0.05)_48%,transparent_68%)] blur-[40px] lg:blur-[48px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-[5%] left-[6%] right-[6%] h-[24%] rounded-full bg-cyan-400/11 blur-[30px]"
            aria-hidden
          />

          <div className="relative w-full aspect-[3/4] animate-float-slow sm:aspect-[4/5] lg:aspect-[3/4]">
            <Image
              src={HERO_IMAGE}
              alt="Geek My Interest mascot"
              fill
              quality={90}
              className="object-contain object-bottom [object-position:center_bottom] lg:[object-position:right_bottom]"
              sizes="(max-width: 1024px) 300px, 400px"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
