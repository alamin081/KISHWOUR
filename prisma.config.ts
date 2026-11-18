import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 CLI configuration (migrate, studio, seed).
 *
 * Neon exposes two connection strings:
 *   DATABASE_URL — pooled (PgBouncer, host contains "-pooler"); used by the app at runtime
 *                  through the driver adapter in src/lib/db.
 *   DIRECT_URL   — direct (unpooled); used here by the CLI, because migrations need
 *                  session-level features (advisory locks) that a transaction pooler
 *                  does not provide.
 *
 * DIRECT_URL falls back to DATABASE_URL for databases without a pooler.
 * `process.env` (not `env()`) is used so `prisma generate` works without any URL,
 * e.g. during `npm install` in CI.
 */
const directUrl = process.env["DIRECT_URL"] || process.env["DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
    // Optional: a separate empty database/branch for `prisma migrate dev`'s shadow DB.
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"] || undefined,
  },
});
