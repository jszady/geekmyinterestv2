"use client";

import { completeProfileAction, type AuthActionState } from "@/app/auth/actions";
import {
  DISPLAY_USERNAME_MAX_LENGTH,
  DISPLAY_USERNAME_MIN_LENGTH,
} from "@/lib/auth/display-username";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

const initial: AuthActionState = { ok: false, error: null };

export function CompleteProfileForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(completeProfileAction, initial);

  useEffect(() => {
    if (state.ok) {
      router.replace("/");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <div className="mx-auto w-full space-y-6">
      <p className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
        Choose your public username to continue.
      </p>
      {!state.ok && state.error ? (
        <p
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <form action={formAction} className="space-y-4" aria-busy={isPending}>
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
            placeholder="Your name"
            disabled={isPending}
            className="w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2.5 text-zinc-100 outline-none ring-cyan-400/40 focus:border-cyan-400/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-zinc-500">
            {DISPLAY_USERNAME_MIN_LENGTH}–{DISPLAY_USERNAME_MAX_LENGTH} characters. Letters, numbers, and
            spaces; multiple spaces are collapsed.
          </p>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg border border-cyan-400/45 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)] transition hover:border-cyan-300/55 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save username"}
        </button>
      </form>
    </div>
  );
}
