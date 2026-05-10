import { ContactHub } from "@/components/contact/ContactHub";
import { Navbar } from "@/components/layout/Navbar";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { getPublicSiteUrl } from "@/lib/site-public-url";
import type { Metadata } from "next";

const siteUrl = getPublicSiteUrl();

export const metadata: Metadata = {
  title: "Contact | Geek My Interest",
  description:
    "Advertise, send a listener letter for the podcast, or get in touch — Geek My Interest contact hub.",
  alternates: { canonical: `${siteUrl}/contact` },
  openGraph: {
    title: "Contact — Geek My Interest",
    description:
      "Advertise, send a listener letter for the podcast, or get in touch — Geek My Interest contact hub.",
    url: `${siteUrl}/contact`,
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />

      <div className="relative z-10 mx-auto w-full max-w-[1100px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <header className="mx-auto mb-14 max-w-2xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-cyan-300/80 sm:text-xs">
            Geek My Interest
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Get in Touch</h1>
          <p className="mt-5 text-base font-semibold leading-relaxed text-zinc-300 sm:text-lg">
            Have a business inquiry, a hot take, or something we need to see?{" "}
            <span className="text-white">Send it our way.</span>
          </p>
        </header>

        <ContactHub />
      </div>
    </main>
  );
}
