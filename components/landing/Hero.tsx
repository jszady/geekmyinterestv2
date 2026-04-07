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

      <div className="relative flex w-full flex-col items-center justify-end px-5 pb-14 pt-10 sm:pb-16 lg:col-start-2 lg:row-start-1 lg:min-h-dvh lg:items-end lg:justify-end lg:px-10 lg:pb-20 lg:pt-32 xl:px-14 2xl:pr-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_48%_at_72%_58%,rgba(56,189,248,0.085),transparent_58%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] bg-gradient-to-t from-[#02040d]/45 via-transparent to-transparent lg:h-[40%]"
          aria-hidden
        />

        {/* Robot position: adjust translate-x / translate-y only (animation stays on Image). */}
        <div className="relative z-[1] w-full max-w-[400px] translate-x-0 translate-y-0 sm:max-w-[460px] md:max-w-[520px] lg:max-w-[560px] xl:max-w-[620px] 2xl:max-w-[650px]">
          <Image
            src={HERO_IMAGE}
            alt="Geek My Interest mascot"
            width={1133}
            height={1474}
            quality={90}
            className="h-auto w-full max-h-[58dvh] object-contain sm:max-h-[62dvh] lg:max-h-[74dvh] xl:max-h-[80dvh] animate-float-slow"
            sizes="(max-width: 640px) 92vw, (max-width: 768px) 520px, (max-width: 1024px) 560px, (max-width: 1280px) 620px, 650px"
            priority
          />
        </div>
      </div>
    </section>
  );
}
