import { z } from "zod";

/**
 * Public (browser-exposed) environment variables.
 * Only NEXT_PUBLIC_* values may live here. Next.js inlines them at build time,
 * so each one must be referenced explicitly (no dynamic `process.env[key]`).
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
});

if (!parsed.success) {
  throw new Error(
    `Invalid public environment variables:\n${parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n")}`,
  );
}

export const clientEnv = parsed.data;
