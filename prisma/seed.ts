/**
 * Seeds reference data only (the six launch categories).
 * Idempotent: safe to run multiple times; it never deletes or overwrites
 * categories that were edited in the admin dashboard (existing slugs are skipped).
 *
 *   npm run db:seed
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { INITIAL_CATEGORIES } from "../src/features/categories/constants";

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  let created = 0;
  for (const category of INITIAL_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: category.slug } });
    if (existing) continue;
    await prisma.category.create({ data: category });
    created++;
  }
  // eslint-disable-next-line no-console -- CLI script output
  console.log(
    `Seed complete: ${created} categories created, ${INITIAL_CATEGORIES.length - created} already existed.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
