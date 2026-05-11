"use client";

import { signUpAction, type AuthActionState } from "@/app/auth/actions";
import {
  DISPLAY_USERNAME_MAX_LENGTH,
  DISPLAY_USERNAME_MIN_LENGTH,
} from "@/lib/auth/display-username";
import { GoogleOAuthButton } from "@/components/auth/GoogleOAuthButton";
import { SignupAvatarSelector } from "@/components/auth/SignupAvatarSelector";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

const initial: AuthActionState = { ok: false, error: null };

export function SignupForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signUpAction, initial);

  useEffect(() => {
    if (state.ok) {
      router.replace("/login?registered=1");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {!state.ok && state.error ? (
        <p
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {!state.ok && state.reason === "duplicate_email" ? (
        <div className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
          <span>Already have an account with this email? </span>
          <Link href="/login" className="font-semibold text-cyan-200 underline-offset-2 hover:underline">
            Log in
          </Link>
        </div>
      ) : null}
      <GoogleOAuthButton nextPath="/" />
      <div className="relative py-1">
        <div className="h-px bg-white/[0.08]" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#02040d] px-3 text-xs uppercase tracking-wider text-zinc-500">
          or
        </span>
      </div>
      <form action={formAction} className="space-y-4" encType="multipart/form-data" aria-busy={pending}>
        <SignupAvatarSelector disabled={pending} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            minLength={DISPLAY_USERNAME_MIN_LENGTH}
            maxLength={DISPLAY_USERNAME_MAX_LENGTH}
            disabled={pending}
            className="w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2.5 text-zinc-100 outline-none ring-cyan-400/40 focus:border-cyan-400/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-zinc-500">
            {DISPLAY_USERNAME_MIN_LENGTH}–{DISPLAY_USERNAME_MAX_LENGTH} characters. Letters, numbers, and
            spaces only.
          </p>
        </div>
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
          <label
            className="mb-1.5 block text-sm font-medium text-zinc-300"
            htmlFor="password"
          >
            Password
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
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg border border-cyan-400/45 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)] transition hover:border-cyan-300/55 disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
          Log in
        </Link>
      </p>
    </div>
  );
}
