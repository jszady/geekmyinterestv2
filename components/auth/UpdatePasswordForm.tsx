"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (!password || !confirmPassword) {
      setError("Both password fields are required.");
      setPending(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setPending(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setPending(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setPending(false);
      return;
    }

    setSuccess("Password updated successfully. Redirecting to login…");
    setPending(false);
    setTimeout(() => {
      router.replace("/login");
      router.refresh();
    }, 900);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {error ? (
        <p
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          {success}
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4" aria-busy={pending}>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={pending}
            className="w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2.5 text-zinc-100 outline-none ring-cyan-400/40 focus:border-cyan-400/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-zinc-300"
            htmlFor="confirmPassword"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            disabled={pending}
            className="w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2.5 text-zinc-100 outline-none ring-cyan-400/40 focus:border-cyan-400/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg border border-cyan-400/45 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)] transition hover:border-cyan-300/55 disabled:opacity-60"
        >
          {pending ? "Updating password..." : "Update password"}
        </button>
      </form>
    </div>
  );
}

