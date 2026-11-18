import "server-only";

import { z } from "zod";

const isPostgresUrl = (value: string) => /^postgres(ql)?:\/\//.test(value);

/** Treat empty strings ("KEY=") as "not set". */
const optional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .optional();

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Database (Neon). DATABASE_URL = pooled connection, used by the app at runtime.
  DATABASE_URL: z
    .string()
    .trim()
    .min(1, "DATABASE_URL is required")
    .refine(isPostgresUrl, "DATABASE_URL must be a PostgreSQL URL"),
  // Direct (unpooled) connection. Read by prisma.config.ts for migrations; validated
  // here only so a malformed value is caught early.
  DIRECT_URL: optional.refine(
    (v) => v === undefined || isPostgresUrl(v),
    "DIRECT_URL must be a PostgreSQL URL",
  ),
  // Runtime database driver:
  //   pg        — node-postgres over TCP (default; production on Vercel)
  //   neon-http — Neon SQL over HTTPS, for HTTPS-only sandboxes such as the Claude Code
  //               cloud environment. Does NOT support transactions.
  DATABASE_DRIVER: z.enum(["pg", "neon-http"]).default("pg"),

  // Auth.js — required once authentication is enabled.
  AUTH_SECRET: optional,
  AUTH_URL: optional.pipe(z.url().optional()),

  // Cloudinary — required for media uploads (admin).
  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,

  // Resend — required for transactional email (inquiry notifications).
  RESEND_API_KEY: optional,
  ADMIN_EMAIL: optional.pipe(z.email().optional()),
  /** Sender for transactional email, e.g. "Kishwour <quotes@your-domain.com>" (domain verified in Resend). */
  EMAIL_FROM: optional,
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

/**
 * Validated server-side environment. Validation runs lazily on first access so
 * importing a module never crashes the build; a missing/invalid variable fails
 * loudly the first time it is actually needed.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid server environment variables:\n${details}`);
  }

  cached = parsed.data;
  return cached;
}

/** Feature flags derived from which integrations are configured. */
export function getIntegrationStatus() {
  const env = getServerEnv();
  return {
    auth: Boolean(env.AUTH_SECRET),
    cloudinary: Boolean(
      env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
    ),
    email: Boolean(env.RESEND_API_KEY && env.ADMIN_EMAIL),
  } as const;
}
