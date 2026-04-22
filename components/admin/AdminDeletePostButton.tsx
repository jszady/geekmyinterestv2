"use client";

import { deletePostAction } from "@/app/admin/post-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = { postId: string; title: string };

export function AdminDeletePostButton({ postId, title }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function runDelete() {
    setError(null);
    start(async () => {
      const res = await deletePostAction(postId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.replace("/admin");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-red-400/25 bg-red-500/[0.06] p-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-red-200/90">
        Danger zone
      </h2>
      <p className="mt-2 text-sm text-zinc-400">
        Delete this post permanently. Comments are removed by the database cascade.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      {!open ? (
        <button
          type="button"
          data-testid="admin-delete-open"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/10"
        >
          Delete post…
        </button>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-300">
            Delete <span className="font-semibold text-white">{title}</span>?
          </p>
          <button
            type="button"
            data-testid="admin-delete-confirm"
            disabled={pending}
            onClick={runDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Confirm delete"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setOpen(false)}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:border-white/20"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
