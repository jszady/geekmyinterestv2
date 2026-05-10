"use client";

import { submitContactForm } from "@/app/contact/actions";
import { useActionState, useEffect, useState } from "react";

type Topic = "advertise" | "listener" | "general";

const topics: {
  id: Topic;
  title: string;
  blurb: string;
  accent: string;
}[] = [
  {
    id: "advertise",
    title: "Advertise With Us",
    blurb: "Partner with Geek My Interest and reach a growing audience in movies, anime, gaming, and tech.",
    accent: "from-violet-500/20 to-cyan-500/10",
  },
  {
    id: "listener",
    title: "Listener Letters",
    blurb: "Got a hot take, question, or story for the podcast? We might feature it.",
    accent: "from-cyan-500/20 to-fuchsia-500/10",
  },
  {
    id: "general",
    title: "General Contact",
    blurb: "Questions, feedback, or anything else.",
    accent: "from-fuchsia-500/15 to-violet-500/15",
  },
];

const field =
  "w-full rounded-xl border border-white/[0.1] bg-[#050a14]/90 px-4 py-3 text-sm text-zinc-100 shadow-inner shadow-black/20 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/45 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] focus:ring-0";

const labelClass = "mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-zinc-400";

type Toast = { kind: "success" | "error"; message: string };

export function ContactHub() {
  const [state, formAction, pending] = useActionState(submitContactForm, undefined);
  const [topic, setTopic] = useState<Topic>("advertise");
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      setToast({ kind: "success", message: "Message sent. We'll get back to you soon." });
      const t = window.setTimeout(() => setToast(null), 6000);
      return () => window.clearTimeout(t);
    }
    setToast({ kind: "error", message: state.error });
    const t = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(t);
  }, [state]);

  if (state?.ok) {
    return (
      <>
        {toast?.kind === "success" ? (
          <div
            className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl border border-cyan-400/40 bg-[#050a14]/95 px-4 py-3 text-sm font-medium text-cyan-100 shadow-[0_0_32px_-8px_rgba(34,211,238,0.45)] backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        ) : null}
        <div
          className="mx-auto max-w-xl rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.08] to-violet-500/[0.06] px-8 py-12 text-center shadow-[0_0_40px_-18px_rgba(34,211,238,0.35)]"
          role="status"
        >
        <p className="text-[10px] font-bold uppercase leading-relaxed tracking-[0.35em] text-cyan-200/90 sm:text-xs">
          Got it.
        </p>
        <p className="mt-4 text-lg font-semibold tracking-tight text-white sm:text-xl">
          We&apos;ll take a look and get back to you.
        </p>
        <p className="mt-3 text-sm text-zinc-400">
          Thanks for reaching out to Geek My Interest.
        </p>
      </div>
      </>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {toast?.kind === "error" ? (
        <div
          className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl border border-red-400/40 bg-[#050a14]/95 px-4 py-3 text-sm font-medium text-red-100 shadow-[0_0_28px_-8px_rgba(248,113,113,0.35)] backdrop-blur-md"
          role="alert"
          aria-live="assertive"
        >
          {toast.message}
        </div>
      ) : null}
      {state && !state.ok ? (
        <p
          className="mb-6 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {topics.map((t) => {
          const selected = topic === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTopic(t.id)}
              aria-pressed={selected}
              className={
                "group relative flex h-full flex-col rounded-2xl border p-5 text-left transition duration-200 " +
                (selected
                  ? "border-cyan-400/50 bg-gradient-to-br " +
                    t.accent +
                    " shadow-[0_0_32px_-12px_rgba(34,211,238,0.45)] ring-2 ring-cyan-400/35"
                  : "border-white/[0.08] bg-[#050a14]/40 hover:border-white/[0.14] hover:bg-[#050a14]/70")
              }
            >
              <span
                className={
                  "text-[10px] font-bold uppercase tracking-[0.2em] " +
                  (selected ? "text-cyan-200" : "text-zinc-500 group-hover:text-zinc-400")
                }
              >
                {selected ? "Selected" : "Choose"}
              </span>
              <span className="mt-2 text-base font-bold leading-snug text-white">{t.title}</span>
              <span className="mt-2 text-sm leading-relaxed text-zinc-400">{t.blurb}</span>
            </button>
          );
        })}
      </div>

      <form
        action={formAction}
        className="space-y-6"
      >
        <input type="hidden" name="contactType" value={topic} />
        {/* Honeypot — must stay empty (avoid name="website": browsers/autofill often fill it) */}
        <input
          type="text"
          name="bot_trap"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute left-[-10000px] h-px w-px opacity-0"
        />

        <div
          key={topic}
          className="space-y-6 rounded-2xl border border-white/[0.08] bg-[#050a14]/35 p-6 transition-[box-shadow,opacity] duration-300 ease-out sm:p-8"
        >
          {topic === "advertise" ? (
            <div className="space-y-6 border-b border-white/[0.06] pb-6">
              <div>
                <label className={labelClass} htmlFor="company">
                  Company name
                </label>
                <input id="company" name="company" type="text" autoComplete="organization" className={field} />
              </div>
              <div>
                <label className={labelClass} htmlFor="budget">
                  Budget <span className="font-normal normal-case tracking-normal text-zinc-500">(optional)</span>
                </label>
                <input
                  id="budget"
                  name="budget"
                  type="text"
                  placeholder="e.g. $2–5k / quarter"
                  className={field}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="lookingFor">
                  What are you looking for?
                </label>
                <textarea
                  id="lookingFor"
                  name="lookingFor"
                  rows={4}
                  placeholder="Sponsorship, newsletter, podcast read, custom package…"
                  className={field + " min-h-[120px] resize-y"}
                />
              </div>
            </div>
          ) : null}

          {topic === "listener" ? (
            <div className="space-y-6 border-b border-white/[0.06] pb-6">
              <div>
                <label className={labelClass} htmlFor="username">
                  Username <span className="font-normal normal-case tracking-normal text-zinc-500">(optional)</span>
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="@you or display name"
                  className={field}
                />
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3 transition hover:border-violet-400/30">
                <input
                  type="checkbox"
                  name="featureOnPodcast"
                  value="on"
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/20 bg-[#050a14] text-cyan-400 focus:ring-cyan-400/40"
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-100">
                    Can we feature this on the podcast?
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    If you&apos;re good with it, we may read or discuss your note on air.
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          <div>
            <label className={labelClass} htmlFor="name">
              Name
            </label>
            <input id="name" name="name" type="text" autoComplete="name" required className={field} />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">
              Email
            </label>
            <input id="email" name="email" type="email" autoComplete="email" required className={field} />
          </div>
          <div>
            <label className={labelClass} htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={6}
              required
              placeholder={
                topic === "advertise"
                  ? "Anything else we should know — timelines, audience fit, links…"
                  : topic === "listener"
                    ? "Your take, question, or story…"
                    : "What’s on your mind?"
              }
              className={field + " min-h-[160px] resize-y"}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl border border-cyan-400/45 bg-gradient-to-r from-cyan-500/18 to-violet-500/18 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_0_28px_-8px_rgba(34,211,238,0.4)] transition hover:border-cyan-300/55 hover:from-cyan-500/25 hover:to-violet-500/25 disabled:opacity-55"
        >
          {pending ? "Sending…" : "Send message"}
        </button>
      </form>
    </div>
  );
}
