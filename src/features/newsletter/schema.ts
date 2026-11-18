import { z } from "zod";

import { emailSchema } from "@/lib/validations/common";

/** Shared by the client form (React Hook Form) and the server action. */
export const newsletterSchema = z.object({
  email: emailSchema,
  /** Honeypot: real users leave it empty; the action silently drops filled submissions. */
  website: z.string().max(500).optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

export type NewsletterResult =
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<keyof NewsletterInput, string>>;
    };
