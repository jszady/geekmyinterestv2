import { SignupForm } from "@/components/auth/SignupForm";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";

export const metadata = {
  title: "Sign up — Geek My Interest",
};

export default function SignupPage() {
  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-[1800px] px-5 pb-16 pt-28 sm:px-8 lg:px-12 xl:px-16">
        <h1
          className="mb-8 text-2xl font-bold tracking-tight text-white md:text-3xl"
          style={{ textShadow: "0 0 18px rgba(34,211,238,0.35)" }}
        >
          Create account
        </h1>
        <SignupForm />
      </div>
    </main>
  );
}
