import { type Prisma } from "@/generated/prisma/client";

import { type CatalogFilters, type SortValue } from "./schemas";

/** Only active products in active categories are public. */
export const publicProductWhere = {
  isActive: true,
  category: { isActive: true },
} satisfies Prisma.ProductWhereInput;

/**
 * Translates validated catalogue filters into a Prisma `where`. Search matches product name,
 * SKU (product and variant), category name, material, product type and short description.
 */
export function buildProductWhere(
  filters: Partial<CatalogFilters>,
): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.category)
    and.push({ category: { slug: filters.category, isActive: true } });
  if (filters.type)
    and.push({ productType: { equals: filters.type, mode: "insensitive" } });
  if (filters.material) and.push({ materials: { has: filters.material } });
  if (filters.featured) and.push({ isFeatured: true });
  if (filters.q) {
    const contains = { contains: filters.q, mode: "insensitive" as const };
    and.push({
      OR: [
        { name: contains },
        { sku: contains },
        { variants: { some: { sku: contains, isActive: true } } },
        { category: { name: contains } },
        { material: contains },
        { productType: contains },
        { shortDescription: contains },
      ],
    });
  }

  return and.length > 0 ? { ...publicProductWhere, AND: and } : { ...publicProductWhere };
}

/** Stable ordering for each sort option (id as final tie-breaker keeps pagination stable). */
export function buildProductOrderBy(
  sort: SortValue,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }, { id: "asc" }];
    case "name-asc":
      return [{ name: "asc" }, { id: "asc" }];
    case "name-desc":
      return [{ name: "desc" }, { id: "asc" }];
    case "moq-asc":
      return [
        { minimumOrderQuantity: { sort: "asc", nulls: "last" } },
        { name: "asc" },
        { id: "asc" },
      ];
    case "featured":
    default:
      return [{ isFeatured: "desc" }, { createdAt: "desc" }, { id: "asc" }];
  }
}
