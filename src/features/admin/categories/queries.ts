import "server-only";

import { db } from "@/lib/db";

export async function listAdminCategories() {
  const rows = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      sortOrder: true,
      parentId: true,
      image: true,
      _count: { select: { products: true, children: true } },
    },
  });
  // Order as a tree: each parent followed by its children.
  const byParent = new Map<string | null, typeof rows>();
  for (const r of rows)
    byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), r]);
  const out: ((typeof rows)[number] & { depth: number })[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const r of byParent.get(parent) ?? []) {
      out.push({ ...r, depth });
      walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  // Orphans (parent deleted) are already re-parented to null by the database (SetNull).
  return out;
}

export async function getCategoryForEdit(id: string) {
  return db.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
}
