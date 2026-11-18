import "server-only";

import { getServerEnv } from "@/lib/env/server";

export type EmailAttachment = { filename: string; content: Buffer };

/** True only when everything needed to send email is configured. */
export function isEmailConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

/**
 * Sends one email through the Resend REST API. Throws with a safe message on failure.
 * Never call this unless isEmailConfigured() is true.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}) {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) throw new Error("Email is not configured.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      ...((input.replyTo ?? env.ADMIN_EMAIL)
        ? { reply_to: input.replyTo ?? env.ADMIN_EMAIL }
        : {}),
      attachments: input.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content.toString("base64"),
      })),
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[email] Resend error", res.status, detail.slice(0, 300));
    throw new Error(`The email service rejected the message (HTTP ${res.status}).`);
  }
  return (await res.json()) as { id: string };
}

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
