"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";

type GoogleOAuthButtonProps = {
  nextPath?: string;
};

export function GoogleOAuthButton({ nextPath = "/" }: GoogleOAuthButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogleClick() {
    setPending(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const base =
        process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
        window.location.origin;
      const redirectTo = `${base}/auth/callback?next=${encodeURIComponent(
        nextPath,
      )}`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) {
        setError(oauthError.message);
        setPending(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign in failed.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={pending}
        onClick={onGoogleClick}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/35 hover:bg-white/[0.06] disabled:opacity-60"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.24 1.26-1.7 3.7-5.5 3.7-3.3 0-6-2.74-6-6.11s2.7-6.11 6-6.11c1.88 0 3.14.82 3.87 1.53l2.64-2.57C16.8 2.96 14.58 2 12 2 6.93 2 2.82 6.16 2.82 11.29 2.82 16.42 6.93 20.58 12 20.58c6.95 0 9.18-4.95 9.18-7.5 0-.5-.05-.88-.12-1.26H12Z"
          />
          <path
            fill="#34A853"
            d="M3.8 7.38l3.2 2.38c.87-2.67 3.33-4.59 5.99-4.59 1.88 0 3.14.82 3.87 1.53l2.64-2.57C16.8 2.96 14.58 2 12 2 8.16 2 4.84 4.22 3.8 7.38Z"
            opacity=".001"
          />
          <path
            fill="#FBBC05"
            d="M3.62 11.29c0 1.63.39 3.16 1.08 4.51l3.04-2.4a6.06 6.06 0 0 1-.33-2.11c0-.73.12-1.43.33-2.11L4.7 6.78a9.1 9.1 0 0 0-1.08 4.51Z"
          />
          <path
            fill="#4285F4"
            d="M12 20.58c2.58 0 4.75-.86 6.34-2.35l-3.01-2.39c-.81.58-1.9.98-3.33.98-2.66 0-4.91-1.83-5.72-4.3l-3.12 2.45C4.2 18.22 7.76 20.58 12 20.58Z"
          />
        </svg>
        {pending ? "Opening Google..." : "Continue with Google"}
      </button>
      {error ? (
        <p
          className="rounded-lg border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
