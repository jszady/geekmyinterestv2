"use client";

import { signInAction, type AuthActionState } from "@/app/auth/actions";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect } from "react";

const initial: AuthActionState = { ok: false, error: null };

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const oauthError = searchParams.get("error");
  const nextParam = searchParams.get("next");
  const [state, formAction, pending] = useActionState(signInAction, initial);

  useEffect(() => {
    if (state.ok) {
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
      router.refresh();
    }
  }, [state.ok, router, searchParams]);

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {registered ? (
        <p className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          Check your email if confirmation is required, then sign in below.
        </p>
      ) : null}
      {oauthError ? (
        <p
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {oauthError}
        </p>
      ) : null}
      {!state.ok && state.error ? (
        <p
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <GoogleOAuthButton
        nextPath={
          nextParam && nextParam.startsWith("/") ? nextParam : "/"
        }
      />
      <div className="relative py-1">
        <div className="h-px bg-white/[0.08]" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#02040d] px-3 text-xs uppercase tracking-wider text-zinc-500">
          or
        </span>
      </div>
      <form action={formAction} className="space-y-4" aria-busy={pending}>
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
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-zinc-300" htmlFor="password">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
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
          {pending ? "Logging in..." : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-400">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-cyan-300 hover:text-cyan-200">
          Sign up
        </Link>
      </p>
    </div>
  );
}
