"use server";

import { headers } from "next/headers";
import { dispatchContactInquiry } from "@/lib/contact/dispatch-inquiry";
import { checkContactRateLimit } from "@/lib/contact/rate-limit";

/**
 * Server-only mail env — read here (same module as "use server") so Next/Turbopack
 * does not drop custom env vars from separate lib chunks.
 *
 * Expected names (exact):
 * - RESEND_API_KEY
 * - CONTACT_TO_EMAIL
 * - CONTACT_FROM_EMAIL
 */
function readContactMailEnv() {
  return {
    resendApiKey: process.env.RESEND_API_KEY?.trim(),
    contactToEmail: process.env.CONTACT_TO_EMAIL?.trim(),
    contactFromEmail: process.env.CONTACT_FROM_EMAIL?.trim(),
  };
}

export type ContactFormState =
  | { ok: true }
  | { ok: false; error: string };

const TOPICS = ["advertise", "listener", "general"] as const;
type Topic = (typeof TOPICS)[number];

const MESSAGE_MAX = 8000;

function isTopic(s: string): s is Topic {
  return (TOPICS as readonly string[]).includes(s);
}

function basicEmailOk(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildContactBodies(params: {
  subject: string;
  senderName: string;
  senderEmail: string;
  message: string;
  timestampIso: string;
  extraTextLines: string[];
}): { html: string; text: string } {
  const { subject, senderName, senderEmail, message, timestampIso, extraTextLines } = params;

  const textLines = [
    `Subject: ${subject}`,
    `From: ${senderName} <${senderEmail}>`,
    `Sent (UTC): ${timestampIso}`,
    "",
    ...extraTextLines,
    "— Message —",
    message,
  ];
  const text = textLines.join("\n");

  const extraHtml =
    extraTextLines.length > 0
      ? `<pre style="white-space:pre-wrap;font-family:inherit;background:#0f172a;padding:12px;border-radius:8px;color:#e2e8f0">${escapeHtml(extraTextLines.join("\n"))}</pre>`
      : "";

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#020617;color:#e2e8f0;font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;">
  <h1 style="margin:0 0 16px;font-size:20px;color:#f8fafc;">New message — Geek My Interest</h1>
  <table style="width:100%;max-width:560px;border-collapse:collapse;">
    <tr><td style="padding:6px 0;color:#94a3b8;width:120px;">Subject</td><td style="padding:6px 0;"><strong>${escapeHtml(subject)}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Name</td><td style="padding:6px 0;">${escapeHtml(senderName)}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(senderEmail)}" style="color:#38bdf8;">${escapeHtml(senderEmail)}</a></td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;">Sent (UTC)</td><td style="padding:6px 0;">${escapeHtml(timestampIso)}</td></tr>
  </table>
  ${extraHtml}
  <h2 style="margin:24px 0 8px;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Message</h2>
  <div style="background:#0f172a;padding:16px;border-radius:8px;border:1px solid #1e293b;white-space:pre-wrap;">${escapeHtml(message)}</div>
</body>
</html>`;

  return { html, text };
}

export async function submitContactForm(
  _prev: ContactFormState | undefined,
  formData: FormData,
): Promise<ContactFormState> {
  const honeypot = String(formData.get("bot_trap") ?? "").trim();
  if (honeypot.length > 0) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const reqHeaders = await headers();
  const ip =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    reqHeaders.get("x-real-ip")?.trim() ??
    "unknown";
  if (!checkContactRateLimit(ip)) {
    return { ok: false, error: "Too many requests. Please try again later." };
  }

  const contactType = String(formData.get("contactType") ?? "").trim();
  if (!isTopic(contactType)) {
    return { ok: false, error: "Pick a contact type." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || name.length > 200) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!email || !basicEmailOk(email)) {
    return { ok: false, error: "Please enter a valid email." };
  }
  if (!message) {
    return { ok: false, error: "Please enter a message." };
  }
  if (message.length > MESSAGE_MAX) {
    return { ok: false, error: `Message must be ${MESSAGE_MAX} characters or less.` };
  }

  const timestampIso = new Date().toISOString();
  const extraTextLines: string[] = [`Contact type: ${contactType}`];

  let subject = `[Geek My Interest] General — ${name}`;

  if (contactType === "advertise") {
    const company = String(formData.get("company") ?? "").trim();
    const budget = String(formData.get("budget") ?? "").trim();
    const lookingFor = String(formData.get("lookingFor") ?? "").trim();
    if (!company || company.length > 200) {
      return { ok: false, error: "Company name is required for advertising inquiries." };
    }
    if (!lookingFor || lookingFor.length < 8) {
      return { ok: false, error: 'Please describe what you are looking for in "What are you looking for?"' };
    }
    if (lookingFor.length > MESSAGE_MAX) {
      return { ok: false, error: `Details must be ${MESSAGE_MAX} characters or less.` };
    }
    extraTextLines.push("— Advertising —");
    extraTextLines.push(`Company: ${company}`);
    if (budget) extraTextLines.push(`Budget: ${budget}`);
    extraTextLines.push("");
    extraTextLines.push("— What they want —");
    extraTextLines.push(lookingFor);
    subject = `[Geek My Interest] Advertise — ${company}`;
  } else if (contactType === "listener") {
    const username = String(formData.get("username") ?? "").trim();
    const featureRaw = formData.get("featureOnPodcast");
    const featureOnPodcast = featureRaw === "on" || featureRaw === "true" || featureRaw === "1";
    extraTextLines.push("— Listener letter —");
    if (username) extraTextLines.push(`Username / handle: ${username}`);
    extraTextLines.push(`OK to feature on podcast: ${featureOnPodcast ? "Yes" : "No"}`);
    subject = `[Geek My Interest] Listener letter — ${name}`;
  }

  const { html, text } = buildContactBodies({
    subject,
    senderName: name,
    senderEmail: email,
    message,
    timestampIso,
    extraTextLines,
  });

  const mailEnv = readContactMailEnv();

  const sent = await dispatchContactInquiry(
    { subject, replyTo: email, html, text },
    mailEnv,
  );

  if (!sent.ok) {
    return { ok: false, error: sent.error };
  }

  return { ok: true };
}
