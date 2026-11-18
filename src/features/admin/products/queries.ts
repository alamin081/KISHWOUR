import "server-only";

import { type Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export const ADMIN_PAGE_SIZE = 20;

export async function listAdminProducts(opts: {
  q?: string;
  status?: string;
  categoryId?: string;
  page: number;
}) {
  const where: Prisma.ProductWhereInput = {
    ...(opts.status === "active"
      ? { isActive: true }
      : opts.status === "inactive"
        ? { isActive: false }
        : {}),
    ...(opts.status === "featured" ? { isFeatured: true } : {}),
    ...(opts.categoryId ? { categoryId: opts.categoryId } : {}),
    ...(opts.q
      ? {
          OR: [
            { name: { contains: opts.q, mode: "insensitive" } },
            { sku: { contains: opts.q, mode: "insensitive" } },
            { slug: { contains: opts.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (opts.page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        isActive: true,
        isFeatured: true,
        minimumOrderQuantity: true,
        unit: true,
        updatedAt: true,
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { imageUrl: true } },
        _count: { select: { variants: true } },
      },
    }),
  ]);
  return { total, items, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getProductForEdit(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      category: { select: { slug: true } },
    },
  });
}

/** Categories for selects (all, including inactive, with hierarchy label). */
export async function getCategoryOptions() {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, isActive: true, parent: { select: { name: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    label: `${c.parent ? `${c.parent.name} › ` : ""}${c.name}${c.isActive ? "" : " (hidden)"}`,
  }));
}
