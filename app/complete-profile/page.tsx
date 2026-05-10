import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";
import { ProfilePicturePicker } from "@/components/profile/ProfilePicturePicker";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { isUsernameIncomplete } from "@/lib/auth/profile-completion";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Complete profile — Geek My Interest",
  robots: { index: false, follow: false },
};

export default async function CompleteProfilePage() {
  const session = await getSessionUser();

  if (!session?.user) {
    redirect("/login?next=/complete-profile");
  }

  const username = session.profile?.username ?? null;
  const incomplete = isUsernameIncomplete(username);

  if (!incomplete) {
    redirect("/");
  }

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-[1800px] px-5 pb-16 pt-28 sm:px-8 lg:px-12 xl:px-16">
        <h1
          className="mb-8 text-2xl font-bold tracking-tight text-white md:text-3xl"
          style={{ textShadow: "0 0 18px rgba(34,211,238,0.35)" }}
        >
          Complete your profile
        </h1>
        <div className="mx-auto max-w-md space-y-10">
          <ProfilePicturePicker
            username={session.profile?.username ?? null}
            email={session.user.email ?? null}
            initialAvatarUrl={session.profile?.avatar_url ?? null}
          />
          <CompleteProfileForm />
        </div>
      </div>
    </main>
  );
}

