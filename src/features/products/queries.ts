import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { catalogTags } from "@/features/catalog-cache";
import { type Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import {
  buildProductOrderBy,
  buildProductWhere,
  publicProductWhere,
} from "./catalog-query";
import { type CatalogFilters, PRODUCTS_PAGE_SIZE, type SortValue } from "./schemas";
import {
  type CatalogFacets,
  type ImageData,
  type PdfProduct,
  type ProductCardData,
  type ProductDetailData,
  type ProductListResult,
} from "./types";

const publicWhere = publicProductWhere;

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  material: true,
  minimumOrderQuantity: true,
  unit: true,
  priceMin: true,
  priceMax: true,
  currency: true,
  incoterm: true,
  isCustomizable: true,
  isFeatured: true,
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { imageUrl: true, altText: true, width: true, height: true },
  },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;
type ImageRow = {
  imageUrl: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

function toImage(row: ImageRow, fallbackAlt: string): ImageData {
  return {
    url: row.imageUrl,
    alt: row.altText ?? fallbackAlt,
    width: row.width,
    height: row.height,
  };
}

function toCard(row: CardRow): ProductCardData {
  const first = row.images[0];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    category: row.category,
    material: row.material,
    image: first ? toImage(first, row.name) : null,
    minimumOrderQuantity: row.minimumOrderQuantity,
    unit: row.unit,
    priceMin: row.priceMin?.toString() ?? null,
    priceMax: row.priceMax?.toString() ?? null,
    currency: row.currency,
    incoterm: row.incoterm,
    isCustomizable: row.isCustomizable,
    isFeatured: row.isFeatured,
  };
}

/** Paginated, filterable, sortable public catalogue (database-side pagination). */
export async function listProducts(
  options: Partial<CatalogFilters> & { page: number; sort?: SortValue },
): Promise<ProductListResult> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.products);
  if (options.category) cacheTag(catalogTags.category(options.category));

  const where = buildProductWhere({
    q: options.q,
    category: options.category,
    type: options.type,
    material: options.material,
    featured: options.featured ?? false,
  });

  const pageSize = PRODUCTS_PAGE_SIZE;
  // Two independent reads (not $transaction): works with every database driver.
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: buildProductOrderBy(options.sort ?? "featured"),
      skip: (options.page - 1) * pageSize,
      take: pageSize,
      select: cardSelect,
    }),
  ]);

  return {
    items: rows.map(toCard),
    total,
    page: options.page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Product-type and material filter options (with counts) for the public catalogue. */
export async function getCatalogFacets(categorySlug?: string): Promise<CatalogFacets> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.products);
  if (categorySlug) cacheTag(catalogTags.category(categorySlug));

  const where = buildProductWhere({ category: categorySlug, featured: false });

  const [types, materials] = await Promise.all([
    db.product.groupBy({
      by: ["productType"],
      where: { ...where, productType: { not: null } },
      _count: { _all: true },
    }),
    db.$queryRaw<{ value: string; count: number }[]>`
      SELECT m AS value, count(*)::int AS count
      FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      CROSS JOIN LATERAL unnest(p.materials) AS m
      WHERE p."isActive" = true AND c."isActive" = true
        AND (${categorySlug ?? null}::text IS NULL OR c.slug = ${categorySlug ?? null}::text)
      GROUP BY m
      ORDER BY m ASC`,
  ]);

  return {
    productTypes: types
      .filter((t): t is typeof t & { productType: string } => Boolean(t.productType))
      .map((t) => ({ value: t.productType, count: t._count._all }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    materials: materials.map((m) => ({ value: m.value, count: Number(m.count) })),
  };
}

/** Featured products for the home page. */
export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.products);

  const rows = await db.product.findMany({
    where: { ...publicWhere, isFeatured: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

/** Full product detail for /products/[slug], or null if not public. */
export async function getProductBySlug(slug: string): Promise<ProductDetailData | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.products, catalogTags.product(slug));

  const row = await db.product.findFirst({
    where: { ...publicWhere, slug },
    select: {
      ...cardSelect,
      categoryId: true,
      sku: true,
      description: true,
      originCountry: true,
      originRegion: true,
      productType: true,
      materials: true,
      variants: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          sku: true,
          color: true,
          size: true,
          material: true,
        },
      },
      colors: true,
      dimensions: true,
      weight: true,
      leadTimeDays: true,
      productionCapacity: true,
      packagingDetails: true,
      hsCode: true,
      sampleAvailable: true,
      customizationOptions: true,
      alibabaUrl: true,
      seoTitle: true,
      seoDescription: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { imageUrl: true, altText: true, width: true, height: true },
      },
    },
  });
  if (!row) return null;

  return {
    ...toCard(row),
    categoryId: row.categoryId,
    sku: row.sku,
    description: row.description,
    images: row.images.map((img, i) => toImage(img, `${row.name} — image ${i + 1}`)),
    originCountry: row.originCountry,
    originRegion: row.originRegion,
    productType: row.productType,
    materials: row.materials,
    variants: row.variants,
    colors: row.colors,
    dimensions: row.dimensions,
    weight: row.weight,
    leadTimeDays: row.leadTimeDays,
    productionCapacity: row.productionCapacity,
    packagingDetails: row.packagingDetails,
    hsCode: row.hsCode,
    sampleAvailable: row.sampleAvailable,
    customizationOptions: row.customizationOptions,
    alibabaUrl: row.alibabaUrl,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };
}

/** Other public products from the same category. */
export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.products);

  const rows = await db.product.findMany({
    where: { ...publicWhere, categoryId, id: { not: excludeId } },
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

/** Slugs + last-modified dates for the sitemap. */
export async function getSitemapEntries(): Promise<{
  products: { slug: string; updatedAt: string }[];
  categories: { slug: string; updatedAt: string }[];
}> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.products, catalogTags.categories);

  const [products, categories] = await Promise.all([
    db.product.findMany({ where: publicWhere, select: { slug: true, updatedAt: true } }),
    db.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  const iso = (r: { slug: string; updatedAt: Date }) => ({
    slug: r.slug,
    updatedAt: r.updatedAt.toISOString(),
  });
  return { products: products.map(iso), categories: categories.map(iso) };
}

/** All public products for the PDF catalogue, ordered by category then name. */
export async function getProductsForCatalogPdf(
  categorySlug?: string,
): Promise<PdfProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(catalogTags.products, catalogTags.categories);

  const rows = await db.product.findMany({
    where: buildProductWhere({ category: categorySlug, featured: false }),
    orderBy: [
      { category: { sortOrder: "asc" } },
      { category: { name: "asc" } },
      { name: "asc" },
    ],
    take: 500,
    select: {
      name: true,
      sku: true,
      slug: true,
      material: true,
      dimensions: true,
      weight: true,
      minimumOrderQuantity: true,
      unit: true,
      leadTimeDays: true,
      priceMin: true,
      priceMax: true,
      currency: true,
      incoterm: true,
      originCountry: true,
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { imageUrl: true } },
    },
  });

  return rows.map(({ images, priceMin, priceMax, ...r }) => ({
    ...r,
    priceMin: priceMin?.toString() ?? null,
    priceMax: priceMax?.toString() ?? null,
    imageUrl: images[0]?.imageUrl ?? null,
  }));
}
