/**
 * Read-only database verification for Neon.
 *
 *   npm run db:verify          # node-postgres over TCP (normal environments)
 *   npm run db:verify:cloud    # Neon SQL over HTTPS (HTTPS-only sandboxes)
 *
 * Checks, without printing any credentials or hostnames:
 *  1. DATABASE_URL (pooled) and DIRECT_URL (direct) are set and reachable.
 *  2. Which Prisma migrations are recorded as applied.
 *  3. All expected application tables exist.
 *
 * Executes only SELECT statements. Never writes, migrates or deletes anything.
 * Exit code 0 = all checks passed, 1 = something failed.
 */
/* eslint-disable no-console -- CLI script output */
import "dotenv/config";

import { neon } from "@neondatabase/serverless";
import { Client } from "pg";

const EXPECTED_TABLES = [
  "Account",
  "Category",
  "Inquiry",
  "InquiryItem",
  "Product",
  "ProductImage",
  "Quotation",
  "QuotationItem",
  "Session",
  "User",
  "VerificationToken",
] as const;

const DRIVER = process.env["DATABASE_DRIVER"] === "neon-http" ? "neon-http" : "pg";

type Row = Record<string, unknown>;
type Runner = { query: (sql: string) => Promise<Row[]>; close: () => Promise<void> };

type Result = { ok: boolean; label: string; detail: string };
const results: Result[] = [];
const record = (ok: boolean, label: string, detail: string) =>
  results.push({ ok, label, detail });

/** Describe a connection string without revealing credentials or the host. */
function describe(url: string): string {
  try {
    const u = new URL(url);
    const pooled = u.hostname.includes("-pooler");
    const isNeon = u.hostname.endsWith(".neon.tech");
    const ssl = u.searchParams.get("sslmode") ?? "not set";
    return `${isNeon ? "Neon" : "PostgreSQL"}, ${pooled ? "pooled" : "direct"}, sslmode=${ssl}, via ${DRIVER}`;
  } catch {
    return "unparseable URL";
  }
}

/** Remove anything credential- or host-like from driver error messages. */
function sanitize(error: unknown, url: string): string {
  let message = error instanceof Error ? error.message : String(error);
  try {
    const u = new URL(url);
    for (const secret of [u.password, u.username, u.hostname]) {
      if (secret) message = message.split(secret).join("***");
    }
  } catch {
    // ignore
  }
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? ` [${String(error.code)}]`
      : "";
  return `${message}${code}`;
}

async function openRunner(url: string): Promise<Runner> {
  if (DRIVER === "neon-http") {
    const sql = neon(url);
    return {
      query: async (text) => (await sql.query(text)) as Row[],
      close: async () => undefined,
    };
  }
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 15_000 });
  await client.connect();
  return {
    query: async (text) => (await client.query(text)).rows as Row[],
    close: () => client.end(),
  };
}

async function checkConnection(
  name: "DATABASE_URL" | "DIRECT_URL",
): Promise<Runner | null> {
  const url = process.env[name]?.trim();
  if (!url) {
    record(false, name, "not set");
    return null;
  }

  const started = Date.now();
  let runner: Runner | null = null;
  try {
    runner = await openRunner(url);
    const rows = await runner.query(
      "SELECT current_database() AS db, split_part(version(), ' ', 2) AS version",
    );
    const row = rows[0];
    record(
      true,
      name,
      `${describe(url)} · database "${String(row?.["db"])}" · PostgreSQL ${String(row?.["version"])} · ${Date.now() - started} ms`,
    );
    return runner;
  } catch (error) {
    record(false, name, `${describe(url)} · ${sanitize(error, url)}`);
    await runner?.close().catch(() => undefined);
    return null;
  }
}

async function checkSchema(runner: Runner): Promise<void> {
  const migrations = await runner
    .query(
      `SELECT migration_name, finished_at, rolled_back_at
         FROM "_prisma_migrations" ORDER BY started_at`,
    )
    .catch(() => null);

  if (migrations === null) {
    record(
      false,
      "Migrations",
      "_prisma_migrations table not found (no migration applied yet)",
    );
  } else {
    const applied = migrations.filter((m) => m["finished_at"] && !m["rolled_back_at"]);
    const failed = migrations.filter((m) => !m["finished_at"] && !m["rolled_back_at"]);
    const names = (list: Row[]) =>
      list.map((m) => String(m["migration_name"])).join(", ");
    record(
      failed.length === 0 && applied.length > 0,
      "Migrations",
      `${applied.length} applied: ${names(applied) || "none"}` +
        (failed.length ? ` · ${failed.length} FAILED/IN PROGRESS: ${names(failed)}` : ""),
    );
  }

  const rows = await runner.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
  );
  const present = new Set(rows.map((r) => String(r["table_name"])));
  const missing = EXPECTED_TABLES.filter((t) => !present.has(t));
  record(
    missing.length === 0,
    "Tables",
    missing.length === 0
      ? `all ${EXPECTED_TABLES.length} application tables present`
      : `missing: ${missing.join(", ")}`,
  );

  if (present.has("Category")) {
    const c = await runner.query(`SELECT count(*)::text AS count FROM "Category"`);
    record(true, "Categories", `${String(c[0]?.["count"] ?? "0")} rows`);
  }
}

async function main() {
  const pooled = await checkConnection("DATABASE_URL");
  const direct = await checkConnection("DIRECT_URL");

  const runner = direct ?? pooled;
  if (runner) await checkSchema(runner);

  await Promise.all([pooled?.close(), direct?.close()]);

  for (const r of results)
    console.log(`${r.ok ? "✔" : "✘"} ${r.label.padEnd(13)} ${r.detail}`);
  const allOk = results.every((r) => r.ok);
  console.log(allOk ? "\nAll database checks passed." : "\nSome database checks failed.");
  process.exitCode = allOk ? 0 : 1;
}

main().catch((error: unknown) => {
  console.error("Unexpected error:", error instanceof Error ? error.name : "unknown");
  process.exitCode = 1;
});
