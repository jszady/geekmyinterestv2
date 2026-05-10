"use client";

import {
  addCommentAction,
  deleteCommentAction,
  type CommentActionState,
} from "@/app/articles/comment-actions";
import { COMMENT_BODY_MAX_CHARS } from "@/lib/comments/constants";
import {
  buildCommentThreads,
  type CommentThreadNode,
  type CommentWithAuthor,
} from "@/lib/comments/comment-thread";
import { UserAvatar } from "@/components/profile/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

const initial: CommentActionState = { ok: false, error: null };

type Props = {
  postId: string;
  postSlug: string;
  comments: CommentWithAuthor[];
  canComment: boolean;
  loginNextPath: string;
  /** Logged-in user id when `canComment` is true; used for delete permission. */
  currentUserId?: string | null;
  isAdmin?: boolean;
};

function displayName(c: CommentWithAuthor) {
  const u = c.username?.trim();
  return u || "User";
}

function CommentCard({
  node,
  depth,
  postId,
  postSlug,
  canComment,
  loginNextPath,
  currentUserId,
  isAdmin,
  afterCommentDeleted,
  openReplyId,
  setOpenReplyId,
  replyError,
  setReplyError,
}: {
  node: CommentThreadNode;
  depth: number;
  postId: string;
  postSlug: string;
  canComment: boolean;
  loginNextPath: string;
  currentUserId: string | null;
  isAdmin: boolean;
  afterCommentDeleted: () => void;
  openReplyId: string | null;
  setOpenReplyId: (id: string | null) => void;
  replyError: string | null;
  setReplyError: (e: string | null) => void;
}) {
  const replyFormRef = useRef<HTMLFormElement>(null);
  const [replyLen, setReplyLen] = useState(0);
  const [replyPending, startReplyTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isReplyOpen = openReplyId === node.id;

  const canDelete =
    Boolean(currentUserId) && (isAdmin || node.user_id === currentUserId);

  useEffect(() => {
    if (isReplyOpen) setReplyLen(0);
  }, [isReplyOpen, node.id]);
  const nestBorder =
    depth > 0
      ? "border-l border-cyan-400/25 pl-4 ml-1 sm:ml-2"
      : "";

  return (
    <li className={nestBorder}>
      <div
        className="rounded-lg border border-white/[0.06] bg-[#050a14]/70 px-4 py-3"
        data-testid={depth === 0 ? "comment-root" : "comment-reply"}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span className="inline-flex min-w-0 items-center gap-2">
            <UserAvatar
              username={node.username}
              avatarUrl={node.avatar_url}
              size="xs"
              decorative
            />
            <span
              className="truncate font-semibold text-cyan-200/90"
              data-testid="comment-author-name"
            >
              {displayName(node)}
            </span>
          </span>
          <time dateTime={node.created_at}>
            {new Date(node.created_at).toLocaleString()}
          </time>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {node.body}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {canComment ? (
            <button
              type="button"
              data-testid="comment-reply-toggle"
              aria-expanded={isReplyOpen}
              onClick={() => {
                setReplyError(null);
                setOpenReplyId(isReplyOpen ? null : node.id);
              }}
              className="text-xs font-semibold text-cyan-300/90 underline decoration-cyan-500/35 underline-offset-2 transition hover:text-cyan-200 hover:decoration-cyan-400/60"
            >
              {isReplyOpen ? "Cancel" : "Reply"}
            </button>
          ) : (
            <Link
              href={loginNextPath}
              data-testid="comment-reply-login"
              className="text-xs font-semibold text-cyan-300/90 underline decoration-cyan-500/35 underline-offset-2 transition hover:text-cyan-200"
            >
              Log in to reply
            </Link>
          )}
          {canDelete ? (
            <button
              type="button"
              data-testid="comment-delete"
              disabled={deletePending}
              onClick={() => {
                if (
                  !window.confirm(
                    "Delete this comment? Replies you own under it will be removed too. This cannot be undone.",
                  )
                ) {
                  return;
                }
                setDeleteError(null);
                startDeleteTransition(async () => {
                  const fd = new FormData();
                  fd.set("comment_id", node.id);
                  fd.set("post_id", postId);
                  const r = await deleteCommentAction(postSlug, initial, fd);
                  if (!r.ok) {
                    setDeleteError(r.error ?? "Could not delete.");
                    return;
                  }
                  afterCommentDeleted();
                });
              }}
              className="text-xs font-semibold text-red-300/90 underline decoration-red-500/35 underline-offset-2 transition hover:text-red-200 hover:decoration-red-400/60 disabled:opacity-50"
            >
              {deletePending ? "Deleting…" : "Delete"}
            </button>
          ) : null}
        </div>
        {deleteError ? (
          <p className="mt-2 text-xs text-red-200" role="alert">
            {deleteError}
          </p>
        ) : null}
        {canComment && isReplyOpen ? (
          <form
            ref={replyFormRef}
            className="mt-4 space-y-2 border-t border-white/[0.06] pt-4"
            data-testid="comment-reply-form"
            aria-busy={replyPending}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startReplyTransition(async () => {
                setReplyError(null);
                const r = await addCommentAction(postSlug, initial, fd);
                if (!r.ok) {
                  setReplyError(r.error ?? "Something went wrong.");
                  return;
                }
                setOpenReplyId(null);
                replyFormRef.current?.reset();
                setReplyLen(0);
              });
            }}
          >
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="parent_comment_id" value={node.id} />
            {replyError && isReplyOpen ? (
              <p className="text-sm text-red-200" role="alert">
                {replyError}
              </p>
            ) : null}
            <label htmlFor={`reply-body-${node.id}`} className="sr-only">
              Reply to {displayName(node)}
            </label>
            <textarea
              id={`reply-body-${node.id}`}
              name="body"
              required
              rows={3}
              maxLength={COMMENT_BODY_MAX_CHARS}
              placeholder="Write a reply…"
              disabled={replyPending}
              onChange={(e) => setReplyLen(e.target.value.length)}
              className="w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/30 focus:border-cyan-400/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-zinc-500" aria-live="polite">
              {replyLen}/{COMMENT_BODY_MAX_CHARS}
            </p>
            <button
              type="submit"
              disabled={replyPending}
              className="rounded-lg border border-cyan-400/45 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {replyPending ? "Posting..." : "Post reply"}
            </button>
          </form>
        ) : null}
      </div>
      {node.replies.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {node.replies.map((child) => (
            <CommentCard
              key={child.id}
              node={child}
              depth={depth + 1}
              postId={postId}
              postSlug={postSlug}
              canComment={canComment}
              loginNextPath={loginNextPath}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              afterCommentDeleted={afterCommentDeleted}
              openReplyId={openReplyId}
              setOpenReplyId={setOpenReplyId}
              replyError={replyError}
              setReplyError={setReplyError}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function ArticleComments({
  postId,
  postSlug,
  comments,
  canComment,
  loginNextPath,
  currentUserId = null,
  isAdmin = false,
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [commentLen, setCommentLen] = useState(0);
  const [state, formAction, pending] = useActionState(
    addCommentAction.bind(null, postSlug),
    initial,
  );

  const threads = useMemo(() => buildCommentThreads(comments), [comments]);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setCommentLen(0);
    }
  }, [state]);

  return (
    <section
      className="mt-14 border-t border-white/[0.08] pt-10"
      aria-labelledby="comments-heading"
    >
      <h2 id="comments-heading" className="text-lg font-bold text-white">
        Comments
      </h2>

      <ul className="mt-6 space-y-5">
        {threads.map((node) => (
          <CommentCard
            key={node.id}
            node={node}
            depth={0}
            postId={postId}
            postSlug={postSlug}
            canComment={canComment}
            loginNextPath={loginNextPath}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            afterCommentDeleted={() => router.refresh()}
            openReplyId={openReplyId}
            setOpenReplyId={setOpenReplyId}
            replyError={replyError}
            setReplyError={setReplyError}
          />
        ))}
        {!threads.length ? (
          <li className="text-sm text-zinc-500">
            No comments yet. Start the thread.
          </li>
        ) : null}
      </ul>

      <div className="mt-8">
        {!canComment ? (
          <p
            data-testid="comment-guest-prompt"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
          >
            <Link
              href={loginNextPath}
              className="font-semibold text-cyan-300 hover:text-cyan-200"
            >
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
            aria-busy={pending}
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
              maxLength={COMMENT_BODY_MAX_CHARS}
              placeholder="Write a comment…"
              disabled={pending}
              onChange={(e) => setCommentLen(e.target.value.length)}
              className="w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/30 focus:border-cyan-400/40 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-zinc-500" aria-live="polite">
              {commentLen}/{COMMENT_BODY_MAX_CHARS}
            </p>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-cyan-400/45 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Posting..." : "Post comment"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
