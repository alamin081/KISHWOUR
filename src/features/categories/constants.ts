/**
 * The launch category set (names + URL slugs agreed in the project brief). Used to seed the
 * database once; afterwards categories are managed from the Admin Dashboard and the database is
 * the source of truth. Category URLs are /products/<slug>.
 */
export const INITIAL_CATEGORIES = [
  { name: "Footwear", slug: "footwear", sortOrder: 1 },
  { name: "Jute Products & Bags", slug: "jute-products", sortOrder: 2 },
  { name: "Handmade Bags & Accessories", slug: "handmade-bags", sortOrder: 3 },
  { name: "Traditional Handicrafts & Textiles", slug: "handicrafts", sortOrder: 4 },
  { name: "Handmade Home Décor", slug: "home-decor", sortOrder: 5 },
  { name: "Jute & Natural Fiber Products", slug: "natural-fiber", sortOrder: 6 },
] as const satisfies ReadonlyArray<{ name: string; slug: string; sortOrder: number }>;
