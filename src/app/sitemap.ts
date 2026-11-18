import type { MetadataRoute } from "next";

import { absoluteUrl, routes } from "@/config/site";
import { getSitemapEntries } from "@/features/products/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getSitemapEntries();

  const staticPages = [
    routes.home,
    routes.products,
    routes.categories,
    routes.wholesale,
    routes.requestQuote,
    routes.about,
    routes.craft,
    routes.sustainability,
    routes.contact,
  ].map((path) => ({ url: absoluteUrl(path) }));

  return [
    ...staticPages,
    ...categories.map((c) => ({
      url: absoluteUrl(routes.category(c.slug)),
      lastModified: c.updatedAt,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(routes.product(p.slug)),
      lastModified: p.updatedAt,
    })),
  ];
}
