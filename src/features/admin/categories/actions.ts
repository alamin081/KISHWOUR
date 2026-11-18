"use server";

import { updateTag } from "next/cache";

import {
  type ActionResult,
  failure,
  fieldErrorsFrom,
} from "@/features/admin/action-result";
import { catalogTags } from "@/features/catalog-cache";
import { assertPermission } from "@/lib/auth/session";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { withTransaction } from "@/lib/db/transaction";

import { type CategoryFormInput, categoryFormSchema, wouldCreateCycle } from "./schema";

function refresh(...slugs: (string | undefined)[]) {
  updateTag(catalogTags.categories);
  updateTag(catalogTags.products);
  for (const s of slugs) if (s) updateTag(catalogTags.category(s));
}

export async function saveCategory(
  id: string | null,
  input: CategoryFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertPermission("categories:manage");
    const parsed = categoryFormSchema.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error),
      };
    const data = parsed.data;

    const productClash = await db.product.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (productClash)
      return {
        ok: false,
        message: "This slug is used by a product.",
        fieldErrors: { slug: "Already used by a product — choose another slug." },
      };

    if (id && data.parentId) {
      const all = await db.category.findMany({ select: { id: true, parentId: true } });
      if (
        wouldCreateCycle(id, data.parentId, new Map(all.map((c) => [c.id, c.parentId])))
      ) {
        return {
          ok: false,
          message: "A category cannot be placed inside itself or its own sub-category.",
          fieldErrors: { parentId: "Invalid parent" },
        };
      }
    }

    const existing = id
      ? await db.category.findUnique({
          where: { id },
          select: { slug: true, imagePublicId: true },
        })
      : null;
    const saved = id
      ? await db.category.update({ where: { id }, data, select: { id: true } })
      : await db.category.create({ data, select: { id: true } });

    if (existing?.imagePublicId && existing.imagePublicId !== data.imagePublicId)
      await destroyCloudinaryAsset(existing.imagePublicId);
    refresh(existing?.slug, data.slug);
    return {
      ok: true,
      message: id ? "Category saved." : "Category created.",
      data: { id: saved.id },
    };
  } catch (error) {
    return failure(error);
  }
}

export async function setCategoryActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    await assertPermission("categories:manage");
    const c = await db.category.update({
      where: { id },
      data: { isActive },
      select: { slug: true },
    });
    refresh(c.slug);
    return {
      ok: true,
      message: isActive ? "Category shown on the website." : "Category hidden.",
    };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Safe delete: refuses while products use the category, unless `reassignToId` is given —
 * then products move to that category first. Sub-categories become top-level.
 */
export async function deleteCategory(
  id: string,
  reassignToId?: string,
): Promise<ActionResult> {
  try {
    await assertPermission("categories:manage");
    const category = await db.category.findUnique({
      where: { id },
      select: { slug: true, imagePublicId: true, _count: { select: { products: true } } },
    });
    if (!category) return { ok: false, message: "The category no longer exists." };

    if (category._count.products > 0) {
      if (!reassignToId) {
        return {
          ok: false,
          message: `${category._count.products} product(s) still use this category. Choose a category to move them to first.`,
        };
      }
      if (reassignToId === id)
        return { ok: false, message: "Choose a different category." };
      const target = await db.category.findUnique({
        where: { id: reassignToId },
        select: { slug: true },
      });
      if (!target) return { ok: false, message: "The target category does not exist." };
      await withTransaction(async (tx) => {
        await tx.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignToId },
        });
        await tx.category.delete({ where: { id } });
      });
      refresh(category.slug, target.slug);
    } else {
      await db.category.delete({ where: { id } });
      refresh(category.slug);
    }
    if (category.imagePublicId) await destroyCloudinaryAsset(category.imagePublicId);
    return { ok: true, message: "Category deleted." };
  } catch (error) {
    return failure(error);
  }
}
