"use client";

import {
  deleteAccountAction,
  updateAdminAuthorProfileAction,
  updatePasswordAction,
  type ActionResult,
} from "@/app/account/settings/actions";
import { signOutAction } from "@/app/auth/actions";
import { AuthorHeaderThumb } from "@/components/authors/AuthorHeaderThumb";
import { ProfilePicturePicker } from "@/components/profile/ProfilePicturePicker";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { useActionState } from "react";

type Props = {
  username: string;
  email: string | null;
  avatarUrl: string | null;
  canUsePassword: boolean;
  isAdmin: boolean;
  initialBio: string | null;
  /** Resolved display URL for author header preview (server-normalized). */
  initialAuthorHeaderImage: string | null;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-[#050a14] px-3 py-2.5 text-sm text-zinc-100 outline-none ring-cyan-400/30 focus:border-cyan-400/40 focus:ring-2";

export function ProfileSettingsClient({
  username,
  email,
  avatarUrl,
  canUsePassword,
  isAdmin,
  initialBio,
  initialAuthorHeaderImage,
}: Props) {
  const [pwState, pwAction, pwPending] = useActionState(
    async (_p: ActionResult | null, fd: FormData): Promise<ActionResult> => {
      return updatePasswordAction(fd);
    },
    null as ActionResult | null,
  );

  const [delState, delAction, delPending] = useActionState(
    async (_p: ActionResult | null, fd: FormData): Promise<ActionResult> => {
      return deleteAccountAction(fd);
    },
    null as ActionResult | null,
  );

  const [adminState, adminAction, adminPending] = useActionState(
    async (_p: ActionResult | null, fd: FormData): Promise<ActionResult> => {
      return updateAdminAuthorProfileAction(fd);
    },
    null as ActionResult | null,
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-10 pb-16">
      <ProfilePicturePicker
        username={username}
        email={email}
        initialAvatarUrl={avatarUrl}
      />

      <section className="rounded-lg border border-white/[0.08] bg-[#050a14]/60 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Username</dt>
            <dd className="mt-1 font-medium text-zinc-100">{username}</dd>
            <p className="mt-1 text-xs text-zinc-500">Username cannot be changed here.</p>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</dt>
            <dd className="mt-1 text-zinc-200">{email ?? "—"}</dd>
            <p className="mt-1 text-xs text-zinc-500">Email is read-only.</p>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-white/[0.08] bg-[#050a14]/60 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Comment preview</h2>
        <p className="mt-1 text-xs text-zinc-500">How you appear on articles.</p>
        <div
          className="mt-4 rounded-lg border border-white/[0.06] bg-[#030711]/80 px-4 py-3"
          data-testid="profile-comment-preview"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <UserAvatar username={username} email={email} avatarUrl={avatarUrl} size="xs" decorative />
              <span className="font-semibold text-cyan-200/90">{username}</span>
            </span>
            <time>Just now</time>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Great take — this is how your comments will look to readers.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-white/[0.08] bg-[#050a14]/60 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Change password</h2>
        {!canUsePassword ? (
          <p className="mt-3 text-sm text-zinc-400">
            Password changes are only available for email/password accounts. You signed in with Google or
            another provider.
          </p>
        ) : (
          <form action={pwAction} className="mt-4 space-y-4">
            {pwState && !pwState.ok ? (
              <p className="text-sm text-red-200" role="alert">
                {pwState.error}
              </p>
            ) : pwState?.ok ? (
              <p className="text-sm text-cyan-200/90">{pwState.message ?? "Saved."}</p>
            ) : null}
            <div>
              <label className="text-xs font-medium text-zinc-400" htmlFor="old_password">
                Current password
              </label>
              <input
                id="old_password"
                name="old_password"
                type="password"
                autoComplete="current-password"
                required
                className={fieldClass}
                disabled={pwPending}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400" htmlFor="new_password">
                New password
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={fieldClass}
                disabled={pwPending}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400" htmlFor="confirm_password">
                Confirm new password
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={fieldClass}
                disabled={pwPending}
              />
            </div>
            <button
              type="submit"
              disabled={pwPending}
              className="rounded-lg border border-cyan-400/45 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/55 disabled:opacity-50"
            >
              {pwPending ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </section>

      {isAdmin ? (
        <section className="rounded-lg border border-fuchsia-400/25 bg-fuchsia-500/[0.04] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-fuchsia-200/90">
            Author page (admin)
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Bio and banner are public on your author profile. Stored in Supabase on save.
          </p>
          <form action={adminAction} className="mt-4 space-y-4">
            {adminState && !adminState.ok ? (
              <p className="text-sm text-red-200" role="alert">
                {adminState.error}
              </p>
            ) : adminState?.ok ? (
              <p className="text-sm text-fuchsia-200/90">{adminState.message ?? "Saved."}</p>
            ) : null}
            <div>
              <label className="text-xs font-medium text-zinc-400" htmlFor="bio">
                Author bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                defaultValue={initialBio ?? ""}
                maxLength={5000}
                className={fieldClass + " resize-y min-h-[120px]"}
                disabled={adminPending}
                placeholder="Short bio for your author page…"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400" htmlFor="author_header">
                Author header / banner image
              </label>
              <input
                id="author_header"
                name="author_header"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={adminPending}
                className="mt-1 block w-full max-w-md text-xs text-zinc-300 file:mr-3 file:rounded-md file:border file:border-fuchsia-400/35 file:bg-fuchsia-500/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-fuchsia-100"
              />
              <p className="mt-1 text-xs text-zinc-500">JPEG, PNG, or WebP · max 5MB · leave empty to keep current.</p>
            </div>
            <button
              type="submit"
              disabled={adminPending}
              className="rounded-lg border border-fuchsia-400/45 bg-fuchsia-500/10 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/55 disabled:opacity-50"
            >
              {adminPending ? "Saving…" : "Save author profile"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-white/[0.06] bg-[#02040d]/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Author preview</p>
            <div className="relative mt-3 h-28 overflow-hidden rounded-lg border border-white/[0.08] bg-zinc-900">
              <div
                className="absolute inset-0 z-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 80% 80% at 20% 20%, rgba(34,211,238,0.15), transparent), radial-gradient(ellipse 70% 70% at 80% 60%, rgba(139,92,246,0.18), transparent)",
                }}
                aria-hidden
              />
              {initialAuthorHeaderImage?.trim() ? (
                <AuthorHeaderThumb src={initialAuthorHeaderImage.trim()} />
              ) : null}
              <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#02040d] via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3 z-[3] flex items-center gap-2">
                <UserAvatar username={username} email={email} avatarUrl={avatarUrl} size="sm" decorative />
                <span className="text-sm font-semibold text-white drop-shadow">{username}</span>
              </div>
            </div>
            <p className="mt-3 line-clamp-4 text-xs leading-relaxed text-zinc-400">
              {(initialBio ?? "").trim() || "Your bio will appear on your public author page."}
            </p>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-white/[0.08] bg-[#050a14]/60 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Account actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/35"
            >
              Log out
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-red-400/20 bg-red-500/[0.04] p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-red-200/90">Delete account</h2>
        {!canUsePassword ? (
          <p className="mt-3 text-sm text-zinc-400">
            Password confirmation is not available for Google or other social sign-in. To delete your account,
            contact support.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-zinc-400">
              This permanently removes your login. Comments and posts may remain; confirm with your password.
            </p>
            <form action={delAction} className="mt-4 space-y-3">
              {delState && !delState.ok ? (
                <p className="text-sm text-red-200" role="alert">
                  {delState.error}
                </p>
              ) : null}
              <div>
                <label className="text-xs font-medium text-zinc-400" htmlFor="delete_password">
                  Password
                </label>
                <input
                  id="delete_password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={fieldClass}
                  disabled={delPending}
                />
              </div>
              <button
                type="submit"
                disabled={delPending}
                className="rounded-lg border border-red-400/45 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-300/55 disabled:opacity-50"
              >
                {delPending ? "Deleting…" : "Delete my account"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
