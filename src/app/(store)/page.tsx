import type { Metadata } from "next";

import { HomepageSection, type HomepageRenderData } from "@/components/homepage/sections";
import { JsonLd } from "@/components/shared/json-ld";
import { absoluteUrl, siteConfig } from "@/config/site";
import { verifiedSustainabilityClaims } from "@/content/site-content";
import { getActiveCategories } from "@/features/categories/queries";
import { getPublishedHomepage } from "@/features/homepage/queries";
import { orderedSectionIds } from "@/features/homepage/schema";
import { getFeaturedProducts, listProducts } from "@/features/products/queries";
import { getSiteSettings } from "@/features/settings/queries";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getPublishedHomepage();
  return {
    title: { absolute: `${siteConfig.name} — Handmade Products from Bangladesh` },
    description: content.hero.subtitle,
    alternates: { canonical: "/" },
  };
}

/**
 * The homepage renders the PUBLISHED document managed in /admin/homepage: section order and
 * visibility come from that document, while category and product cards keep coming from the
 * Category and Product records. If nothing is published (or the database is unreachable) the
 * content in src/content/site-content.ts is used instead.
 */
export default async function HomePage() {
  const [content, categories, featured, settings] = await Promise.all([
    getPublishedHomepage(),
    getActiveCategories(),
    getFeaturedProducts(8),
    getSiteSettings(),
  ]);
  // No featured products yet → show the newest public products instead.
  const products =
    featured.length > 0 ? featured : (await listProducts({ page: 1 })).items.slice(0, 8);

  const data: HomepageRenderData = {
    categories,
    products,
    sustainabilityClaims: verifiedSustainabilityClaims,
    whatsapp: settings.contact.whatsapp,
  };

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteConfig.name,
          slogan: settings.brand.tagline,
          url: absoluteUrl("/"),
          logo: absoluteUrl(siteConfig.logo.src),
          ...(settings.alibaba.storeUrl ? { sameAs: [settings.alibaba.storeUrl] } : {}),
        }}
      />
      {orderedSectionIds(content)
        .filter((id) => content[id].visible)
        .map((id) => (
          <HomepageSection key={id} id={id} content={content} data={data} />
        ))}
    </>
  );
}
