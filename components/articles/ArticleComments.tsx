"use client";

import {
  addCommentAction,
  type CommentActionState,
} from "@/app/articles/comment-actions";
import type { CommentWithAuthor } from "@/lib/comments/queries";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

const initial: CommentActionState = { ok: false, error: null };

type Props = {
  postId: string;
  postSlug: string;
  comments: CommentWithAuthor[];
  canComment: boolean;
  loginNextPath: string;
};

function displayName(c: CommentWithAuthor) {
  const u = c.username?.trim();
  return u || "User";
}

export function ArticleComments({
  postId,
  postSlug,
  comments,
  canComment,
  loginNextPath,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    addCommentAction.bind(null, postSlug),
    initial,
  );

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <section className="mt-14 border-t border-white/[0.08] pt-10" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-lg font-bold text-white">
        Comments
      </h2>

      <ul className="mt-6 space-y-5">
        {comments.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-white/[0.06] bg-[#050a14]/70 px-4 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-zinc-500">
              <span className="font-semibold text-cyan-200/90" data-testid="comment-author-name">
              {displayName(c)}
            </span>
              <time dateTime={c.created_at}>
                {new Date(c.created_at).toLocaleString()}
              </time>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
              {c.body}
            </p>
          </li>
        ))}
        {!comments.length ? (
          <li className="text-sm text-zinc-500">No comments yet. Start the thread.</li>
        ) : null}
      </ul>

      <div className="mt-8">
        {!canComment ? (
          <p
            data-testid="comment-guest-prompt"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
          >
            <Link href={loginNextPath} className="font-semibold text-cyan-300 hover:text-cyan-200">
              Log in
            </Link>{" "}
            to join the discussion.
          </p>
        ) : (
          <form
            ref={formRef}
            action={formAction}
            className="space-y-3"
            data-testid="comment-form"
          >
            <input type="hidden" name="post_id" value={postId} />
            {state && !state.ok && state.error ? (
              <p className="text-sm text-red-200" role="alert">
                {state.error}
              </p>
            ) : null}
            <label htmlFor="comment-body" className="sr-only">
              Comment
            </label>
            <textarea
              id="comment-body"
              name="body"
              required
              rows={4}
              placeholder="Write a comment…"
              className="w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/30 focus:border-cyan-400/40 focus:ring-2"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-cyan-400/45 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Posting…" : "Post comment"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
