/**
 * Creates (or promotes) the first administrator.
 *
 *   ADMIN_EMAIL=... ADMIN_INITIAL_PASSWORD=... [ADMIN_NAME=...] npm run admin:create
 *
 * Reads credentials from environment variables only (never from arguments or chat) and
 * never prints the password. If the user already exists, the password is NOT changed unless
 * `--reset-password` is passed.
 */
/* eslint-disable no-console -- CLI script output */
import "dotenv/config";

import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword, passwordProblem } from "../src/lib/auth/password";

async function main() {
  const email = process.env["ADMIN_EMAIL"]?.trim().toLowerCase();
  const password = process.env["ADMIN_INITIAL_PASSWORD"] ?? "";
  const name = process.env["ADMIN_NAME"]?.trim() || "Administrator";
  const reset = process.argv.includes("--reset-password");
  const url = process.env["DATABASE_URL"];

  if (!url) throw new Error("DATABASE_URL is not set");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Set ADMIN_EMAIL to a valid email address");
  const problem = passwordProblem(password);
  if (problem) throw new Error(`ADMIN_INITIAL_PASSWORD: ${problem}`);

  const adapter =
    process.env["DATABASE_DRIVER"] === "neon-http"
      ? new PrismaNeonHttp(url, { arrayMode: true, fullResults: true })
      : new PrismaPg({ connectionString: url });
  const db = new PrismaClient({ adapter });

  try {
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (existing) {
      await db.user.update({
        where: { id: existing.id },
        data: {
          role: "ADMIN",
          isActive: true,
          ...(reset ? { passwordHash: await hashPassword(password) } : {}),
        },
      });
      console.log(
        `Existing user ${email} is now an active ADMIN${reset ? " (password reset)" : " (password unchanged)"}.`,
      );
    } else {
      await db.user.create({
        data: {
          email,
          name,
          role: "ADMIN",
          isActive: true,
          passwordHash: await hashPassword(password),
        },
      });
      console.log(
        `Created ADMIN user ${email}. Sign in at /admin/login, then remove ADMIN_INITIAL_PASSWORD from the environment.`,
      );
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
