"use server";

import { updateTag } from "next/cache";

import {
  type ActionResult,
  failure,
  fieldErrorsFrom,
} from "@/features/admin/action-result";
import { catalogTags } from "@/features/catalog-cache";
import { isValidAlibabaUrl } from "@/features/products/links";
import { assertPermission } from "@/lib/auth/session";
import { destroyCloudinaryAsset } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { withTransaction } from "@/lib/db/transaction";

import { type ProductFormInput, productFormSchema } from "./schema";

function refreshCatalog(...slugs: (string | undefined)[]) {
  updateTag(catalogTags.products);
  updateTag(catalogTags.categories);
  for (const slug of slugs) if (slug) updateTag(catalogTags.product(slug));
}

/** Create (id = null) or update a product with its images and variants. */
export async function saveProduct(
  id: string | null,
  input: ProductFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertPermission("products:manage");
    const parsed = productFormSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error),
      };
    }
    const { images, variants, ...data } = parsed.data;

    // Products and categories share /products/<slug>.
    const clash = await db.category.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (clash)
      return {
        ok: false,
        message: "This slug is used by a category.",
        fieldErrors: { slug: "Already used by a category — choose another slug." },
      };

    const existing = id
      ? await db.product.findUnique({
          where: { id },
          select: {
            slug: true,
            alibabaUrl: true,
            alibabaProductId: true,
            images: { select: { publicId: true } },
          },
        })
      : null;
    if (id && !existing) return { ok: false, message: "The product no longer exists." };

    const alibabaChanged =
      !existing ||
      existing.alibabaUrl !== data.alibabaUrl ||
      existing.alibabaProductId !== data.alibabaProductId;
    const alibabaUpdatedAt =
      alibabaChanged && (data.alibabaUrl || data.alibabaProductId)
        ? new Date()
        : undefined;

    const savedId = await withTransaction(async (tx) => {
      const product = id
        ? await tx.product.update({
            where: { id },
            data: { ...data, ...(alibabaUpdatedAt ? { alibabaUpdatedAt } : {}) },
            select: { id: true },
          })
        : await tx.product.create({
            data: { ...data, alibabaUpdatedAt },
            select: { id: true },
          });

      // Images: replace in the given order (index 0 = primary image).
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((img, i) => ({
            ...img,
            width: img.width ?? null,
            height: img.height ?? null,
            productId: product.id,
            sortOrder: i,
          })),
        });
      }

      // Variants: update kept, create new, delete removed.
      const keepIds = variants.map((v) => v.id).filter((v): v is string => Boolean(v));
      await tx.productVariant.deleteMany({
        where: { productId: product.id, id: { notIn: keepIds } },
      });
      for (const [i, v] of variants.entries()) {
        const { id: variantId, ...fields } = v;
        if (variantId) {
          await tx.productVariant.update({
            where: { id: variantId, productId: product.id },
            data: { ...fields, sortOrder: i },
          });
        } else {
          await tx.productVariant.create({
            data: { ...fields, sortOrder: i, productId: product.id },
          });
        }
      }
      return product.id;
    });

    // Remove Cloudinary assets that are no longer used (after the database commit).
    const kept = new Set(images.map((i) => i.publicId).filter(Boolean));
    for (const old of existing?.images ?? [])
      if (old.publicId && !kept.has(old.publicId))
        await destroyCloudinaryAsset(old.publicId);

    refreshCatalog(existing?.slug, data.slug);
    return {
      ok: true,
      message: id ? "Product saved." : "Product created.",
      data: { id: savedId },
    };
  } catch (error) {
    return failure(error);
  }
}

/** Publish / unpublish (archive) without deleting. */
export async function setProductActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    await assertPermission("products:manage");
    const p = await db.product.update({
      where: { id },
      data: { isActive },
      select: { slug: true },
    });
    refreshCatalog(p.slug);
    return {
      ok: true,
      message: isActive ? "Product published." : "Product unpublished.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function setProductFeatured(
  id: string,
  isFeatured: boolean,
): Promise<ActionResult> {
  try {
    await assertPermission("products:manage");
    const p = await db.product.update({
      where: { id },
      data: { isFeatured },
      select: { slug: true },
    });
    refreshCatalog(p.slug);
    return {
      ok: true,
      message: isFeatured ? "Marked as featured." : "Removed from featured.",
    };
  } catch (error) {
    return failure(error);
  }
}

/** Permanent delete. Inquiry/quotation history keeps the product name (SetNull). */
export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await assertPermission("products:manage");
    const p = await db.product.delete({
      where: { id },
      select: { slug: true, images: { select: { publicId: true } } },
    });
    for (const img of p.images)
      if (img.publicId) await destroyCloudinaryAsset(img.publicId);
    refreshCatalog(p.slug);
    return { ok: true, message: "Product deleted." };
  } catch (error) {
    return failure(error);
  }
}

/** Alibaba page: update a product's manual Alibaba link/ID and record the update time. */
export async function updateProductAlibaba(
  id: string,
  input: { alibabaUrl: string; alibabaProductId: string },
): Promise<ActionResult> {
  try {
    await assertPermission("alibaba:manage");
    const url = input.alibabaUrl.trim() || null;
    const pid = input.alibabaProductId.trim().slice(0, 40) || null;
    if (url && !isValidAlibabaUrl(url))
      return { ok: false, message: "Use an https:// link on alibaba.com." };
    const p = await db.product.update({
      where: { id },
      data: { alibabaUrl: url, alibabaProductId: pid, alibabaUpdatedAt: new Date() },
      select: { slug: true },
    });
    refreshCatalog(p.slug);
    return { ok: true, message: "Alibaba details saved." };
  } catch (error) {
    return failure(error);
  }
}
