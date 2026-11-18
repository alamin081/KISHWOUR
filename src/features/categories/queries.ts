import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { catalogTags } from "@/features/catalog-cache";
import { db } from "@/lib/db";

import type { CategoryDetail, CategorySummary } from "./types";

const summarySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  _count: { select: { products: { where: { isActive: true } } } },
} as const;

/** Active top-level categories with their count of visible products. */
export async function getActiveCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.categories);

  const rows = await db.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: summarySelect,
  });

  return rows.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
}

/** A single active category, or null if it does not exist / is hidden. */
export async function getCategoryBySlug(slug: string): Promise<CategoryDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.categories, catalogTags.category(slug));

  const row = await db.category.findFirst({
    where: { slug, isActive: true },
    select: { ...summarySelect, seoTitle: true, seoDescription: true },
  });
  if (!row) return null;

  const { _count, ...c } = row;
  return { ...c, productCount: _count.products };
}
