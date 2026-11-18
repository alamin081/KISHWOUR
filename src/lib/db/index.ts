import "server-only";

import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv, type ServerEnv } from "@/lib/env/server";

/**
 * Server-only database access.
 *
 * - One PrismaClient per server process (reused across dev hot reloads via globalThis).
 * - Created lazily on first query, so importing this module (e.g. during `next build`)
 *   never needs DATABASE_URL or a network connection.
 * - Connects with Neon's *pooled* connection string (DATABASE_URL).
 *
 * Drivers (DATABASE_DRIVER):
 * - "pg" (default): node-postgres over TCP. Full Prisma feature set. Used in production.
 * - "neon-http": Neon's SQL-over-HTTPS endpoint. Only for environments that allow HTTPS but
 *   not raw TCP (e.g. the Claude Code cloud sandbox; see `npm run dev:cloud`). Transactions
 *   — `$transaction`, nested writes that need one — are NOT supported in this mode.
 */

export type DatabaseDriver = ServerEnv["DATABASE_DRIVER"];

function createAdapter(env: ServerEnv) {
  if (env.DATABASE_DRIVER === "neon-http") {
    return new PrismaNeonHttp(env.DATABASE_URL, { arrayMode: true, fullResults: true });
  }

  return new PrismaPg({
    connectionString: env.DATABASE_URL,
    // Serverless functions each hold a small pool; Neon's pooler multiplexes them.
    max: env.NODE_ENV === "production" ? 5 : 10,
    // Neon computes can scale to zero; allow time for a cold start.
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 30_000,
  });
}

function createPrismaClient(): PrismaClient {
  const env = getServerEnv();
  return new PrismaClient({
    adapter: createAdapter(env),
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { __kishwourPrisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  globalForPrisma.__kishwourPrisma ??= createPrismaClient();
  return globalForPrisma.__kishwourPrisma;
}

/** Shared Prisma client. Import this; never call `new PrismaClient()` elsewhere. */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value: unknown = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/** Client type available inside `db.$transaction(async (tx) => …)`. */
export type TransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

/** True when a DATABASE_URL is present (does not test connectivity). */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env["DATABASE_URL"]?.trim());
}

/** The runtime driver in use ("pg" or "neon-http"). */
export function getDatabaseDriver(): DatabaseDriver {
  return getServerEnv().DATABASE_DRIVER;
}

/** Checks connectivity with a trivial query. Throws if the database is unreachable. */
export async function pingDatabase(): Promise<void> {
  await db.$queryRaw`SELECT 1`;
}
