"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { FormEvent, useState } from "react";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    if (!email) {
      setError("Email is required.");
      setPending(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
    const redirectBase = fromEnv || window.location.origin;
    const redirectTo = `${redirectBase}/update-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      setError(resetError.message);
      setPending(false);
      return;
    }

    setSuccess("Password reset email sent. Check your inbox.");
    setPending(false);
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
          <label className="mb-1.5 block text-sm font-medium text-zinc-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            className="w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2.5 text-zinc-100 outline-none ring-cyan-400/40 focus:border-cyan-400/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg border border-cyan-400/45 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)] transition hover:border-cyan-300/55 disabled:opacity-60"
        >
          {pending ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </div>
  );
}

