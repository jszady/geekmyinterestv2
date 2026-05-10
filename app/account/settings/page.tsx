import { ProfileSettingsClient } from "@/components/account/ProfileSettingsClient";
import { SiteBackdrop } from "@/components/layout/SiteBackdrop";
import { Navbar } from "@/components/layout/Navbar";
import { userHasEmailPasswordIdentity } from "@/lib/auth/identity";
import { isAdmin } from "@/lib/auth/roles";
import { isUsernameIncomplete } from "@/lib/auth/profile-completion";
import { getSessionUser } from "@/lib/auth/session";
import { resolveAuthorHeaderImageForDisplay } from "@/lib/profile/author-header-display-url";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile settings — Geek My Interest",
  robots: { index: false, follow: false },
};

export default async function AccountSettingsPage() {
  const session = await getSessionUser();
  if (!session?.user) {
    redirect("/login?next=/account/settings");
  }

  const username = session.profile?.username ?? null;
  if (isUsernameIncomplete(username)) {
    redirect("/complete-profile");
  }

  const displayUsername = username!.trim();
  const profile = session.profile;
  const canUsePassword = userHasEmailPasswordIdentity(session.user);
  const admin = isAdmin(profile);
  const authorHeaderDisplay = await resolveAuthorHeaderImageForDisplay(
    profile?.author_header_image ?? null,
  );

  return (
    <main className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <SiteBackdrop />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-[1800px] px-5 pb-16 pt-28 sm:px-8 lg:px-12 xl:px-16">
        <h1
          className="mb-8 text-2xl font-bold tracking-tight text-white md:text-3xl"
          style={{ textShadow: "0 0 18px rgba(34,211,238,0.35)" }}
        >
          Profile settings
        </h1>
        <ProfileSettingsClient
          username={displayUsername}
          email={session.user.email ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          canUsePassword={canUsePassword}
          isAdmin={admin}
          initialBio={profile?.bio ?? null}
          initialAuthorHeaderImage={authorHeaderDisplay}
        />
      </div>
    </main>
  );
}
