/**
 * Cache tags for catalog data. Admin mutations (later phase) call `updateTag()` /
 * `revalidateTag()` with these so storefront pages refresh immediately after an edit.
 */
export const catalogTags = {
  categories: "catalog:categories",
  category: (slug: string) => `catalog:category:${slug}`,
  products: "catalog:products",
  product: (slug: string) => `catalog:product:${slug}`,
} as const;
