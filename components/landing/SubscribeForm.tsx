"use client";

import type { FormEvent } from "react";

export function SubscribeForm() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch sm:rounded-full sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-1.5 sm:pl-5 sm:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
    >
      <label htmlFor="hero-email" className="sr-only">
        Email address
      </label>
      <input
        id="hero-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Enter your email"
        className="min-h-12 w-full rounded-full border border-white/10 bg-white/[0.06] px-5 text-sm text-white placeholder:text-zinc-500 outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20 sm:border-0 sm:bg-transparent sm:shadow-none"
      />
      <button
        type="submit"
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_0_28px_-6px_rgba(34,211,238,0.6)] transition hover:brightness-110 active:scale-[0.98]"
      >
        Subscribe Now
        <span aria-hidden className="text-base leading-none">
          →
        </span>
      </button>
    </form>
  );
}
