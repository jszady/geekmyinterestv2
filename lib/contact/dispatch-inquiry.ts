/**
 * Sends contact form submissions via Resend (server-only).
 *
 * Callers must pass mail credentials from app/contact/actions.ts after reading:
 * - process.env.RESEND_API_KEY
 * - process.env.CONTACT_TO_EMAIL
 * - process.env.CONTACT_FROM_EMAIL
 *
 * Do not use NEXT_PUBLIC_* for secrets.
 */

export type ContactDispatchPayload = {
  subject: string;
  replyTo: string;
  html: string;
  text: string;
};

/** Populated from process.env in the server action only (avoids env loss across server chunks). */
export type ContactMailEnv = {
  resendApiKey: string | undefined;
  contactToEmail: string | undefined;
  contactFromEmail: string | undefined;
};

export type ContactDispatchResult =
  | { ok: true; mode: "email" }
  | { ok: true; mode: "logged" }
  | { ok: false; error: string };

const DEFAULT_FROM = "Geek My Interest <contact@geekmyinterest.com>";

export async function dispatchContactInquiry(
  payload: ContactDispatchPayload,
  mailEnv: ContactMailEnv,
): Promise<ContactDispatchResult> {
  const key = mailEnv.resendApiKey?.trim();
  const to = mailEnv.contactToEmail?.trim();
  const from = mailEnv.contactFromEmail?.trim() || DEFAULT_FROM;

  if (!key || !to) {
    return { ok: true, mode: "logged" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: payload.replyTo,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const json = (await res.json().catch(() => null)) as
      | { message?: string; id?: string }
      | null;

    if (!res.ok) {
      const msg =
        (json && typeof json.message === "string" && json.message) ||
        `Resend HTTP ${res.status}`;
      console.error("[contact] Resend error:", msg, res.status);
      return { ok: false, error: "Could not send message. Try again later." };
    }

    return { ok: true, mode: "email" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[contact] fetch failed:", msg);
    return { ok: false, error: "Could not send message. Try again later." };
  }
}
