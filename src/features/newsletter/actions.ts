"use server";

import { newsletterSchema, type NewsletterResult } from "./schema";

/**
 * Newsletter sign-up.
 *
 * Validation is complete (server-side, same schema as the form). Storing subscribers is
 * NOT connected yet — the storage choice (database table vs. Resend Audiences) is pending
 * the owner's decision — so this returns an honest "not yet available" result instead of
 * pretending the address was saved.
 */
export async function subscribeToNewsletter(input: unknown): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<"email" | "website", string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "email" || key === "website") fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Please check the form and try again.", fieldErrors };
  }

  // Honeypot filled → silently accept without doing anything.
  if (parsed.data.website) {
    return { ok: true, message: "Thank you." };
  }

  return {
    ok: false,
    message:
      "Newsletter sign-up is not open yet. Your email was not stored — please check back soon.",
  };
}
