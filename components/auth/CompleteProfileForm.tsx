"use client";

import {
  DISPLAY_USERNAME_MAX_LENGTH,
  DISPLAY_USERNAME_MIN_LENGTH,
  displayUsernameIlikePattern,
  normalizeDisplayUsername,
  validateDisplayUsername,
} from "@/lib/auth/display-username";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompleteProfileForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement | null }) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(e.currentTarget ?? undefined);
    const submitted = String(form.get("username") ?? "");
    const normalized = normalizeDisplayUsername(submitted);
    const validated = validateDisplayUsername(normalized);
    if (!validated.ok) {
      setError(validated.error);
      setPending(false);
      return;
    }
    const cleaned = validated.username;

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("You must be logged in.");
      setPending(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setPending(false);
      return;
    }

    const duplicatePattern = displayUsernameIlikePattern(cleaned);
    const { data: duplicateRows, error: duplicateError } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", duplicatePattern)
      .neq("id", user.id)
      .limit(1);

    if (duplicateError) {
      setError(duplicateError.message);
      setPending(false);
      return;
    }
    if ((duplicateRows ?? []).length > 0) {
      setError("Username already taken");
      setPending(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: cleaned })
      .eq("id", user.id);

    if (updateError) {
      if (
        updateError.code === "23505" ||
        updateError.message.toLowerCase().includes("duplicate")
      ) {
        setError("Username already taken");
      } else {
        setError(updateError.message);
      }
      setPending(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full space-y-6">
      <p className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
        Choose your public username to continue.
      </p>
      {error ? (
        <p
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-4" aria-busy={pending}>
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
            disabled={pending}
            className="w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2.5 text-zinc-100 outline-none ring-cyan-400/40 focus:border-cyan-400/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <p className="mt-2 text-xs text-zinc-500">
            {DISPLAY_USERNAME_MIN_LENGTH}–{DISPLAY_USERNAME_MAX_LENGTH} characters. Letters, numbers, and
            spaces; multiple spaces are collapsed.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg border border-cyan-400/45 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-6px_rgba(34,211,238,0.45)] transition hover:border-cyan-300/55 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save username"}
        </button>
      </form>
    </div>
  );
}

