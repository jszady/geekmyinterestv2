import { evaluateAdminGate } from "@/lib/auth/admin-gate";
import { getSessionUser } from "@/lib/auth/session";
import { NavbarView } from "@/components/layout/NavbarView";

export async function Navbar() {
  const session = await getSessionUser();
  const gate = evaluateAdminGate(session);
  const username =
    session?.profile?.username ?? session?.user?.email ?? "Account";

  return (
    <NavbarView
      signedIn={!!session}
      username={username}
      isAdmin={gate.ok}
    />
  );
}
