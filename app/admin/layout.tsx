import { evaluateAdminGate } from "@/lib/auth/admin-gate";
import { getSessionUser } from "@/lib/auth/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  const gate = evaluateAdminGate(session);

  if (!gate.ok) {
    if (gate.reason === "unauthenticated") {
      redirect("/login?next=/admin");
    }
    if (process.env.NODE_ENV === "development") {
      const qs = new URLSearchParams({
        adminDenied: "1",
        reason: gate.reason,
      });
      redirect(`/?${qs.toString()}`);
    }
    redirect("/");
  }

  return (
    <div className="relative min-h-dvh bg-[#02040d] text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#060818] via-[#02040d] to-[#010208]"
        aria-hidden
      />
      <header className="relative z-10 border-b border-white/[0.06] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-zinc-400 hover:text-cyan-200">
              ← Site
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-white">Admin</h1>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/admin" className="text-cyan-200/90 hover:text-cyan-100">
              Posts
            </Link>
            <Link
              href="/admin/posts/new"
              className="rounded-md border border-cyan-400/35 px-3 py-1.5 text-cyan-100 hover:border-cyan-300/55"
            >
              New post
            </Link>
          </nav>
        </div>
      </header>
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</div>
    </div>
  );
}
