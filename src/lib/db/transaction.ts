import "server-only";

import { getServerEnv } from "@/lib/env/server";

import { db, type TransactionClient } from "./index";

/**
 * Runs `fn` atomically. With the default `pg` driver (production) this is a real interactive
 * transaction. The `neon-http` driver (HTTPS-only cloud sandbox, development only) cannot run
 * transactions, so there the statements run sequentially WITHOUT atomicity.
 */
export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  if (getServerEnv().DATABASE_DRIVER === "neon-http") {
    return fn(db as unknown as TransactionClient);
  }
  return db.$transaction(fn, { timeout: 15_000 });
}
