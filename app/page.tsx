import { EditorialLeadSection } from "@/components/home/EditorialLeadSection";
import { LatestSection } from "@/components/home/LatestSection";
import { NewsletterCtaSection } from "@/components/landing/NewsletterCtaSection";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#060818] via-[#02040d] to-[#010208]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_85%_35%,rgba(56,189,248,0.16),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_15%_75%,rgba(139,92,246,0.11),transparent_52%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_100%,rgba(15,23,42,0.5),transparent_45%)]"
        aria-hidden
      />

      <Navbar />
      <EditorialLeadSection />
      <LatestSection />
      <NewsletterCtaSection />
    </main>
  );
}
