import { readFile } from "node:fs/promises";
import path from "node:path";

import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { type NextRequest } from "next/server";
import { createElement, type ReactElement } from "react";

import { absoluteUrl, routes } from "@/config/site";
import { CatalogPdf } from "@/features/catalog-pdf/document";
import { fetchImages } from "@/features/catalog-pdf/images";
import { getActiveCategories } from "@/features/categories/queries";
import { getProductsForCatalogPdf } from "@/features/products/queries";
import { getSiteSettings } from "@/features/settings/queries";

/**
 * GET /catalog.pdf[?category=<slug>] — downloadable product catalogue generated from the
 * database (Prisma). Cached at the CDN for an hour.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("category") ?? undefined;
  const categories = await getActiveCategories();
  const category = raw ? categories.find((c) => c.slug === raw) : undefined;
  if (raw && !category) {
    return new Response("Category not found", { status: 404 });
  }

  try {
    const [products, logo] = await Promise.all([
      getProductsForCatalogPdf(category?.slug),
      readFile(path.join(process.cwd(), "public", "brand", "kishwour-logo.png")),
    ]);
    const images = await fetchImages(products.map((p) => p.imageUrl));

    const settings = await getSiteSettings();
    const { email, phone, whatsapp, address } = settings.contact;
    const contact = [
      email && { label: "Email", value: email, href: `mailto:${email}` },
      phone && { label: "Phone", value: phone },
      whatsapp && {
        label: "WhatsApp",
        value: `+${whatsapp}`,
        href: `https://wa.me/${whatsapp}`,
      },
      address && { label: "Address", value: address },
      settings.alibaba.storeUrl && {
        label: "Alibaba Store",
        value: settings.alibaba.storeUrl,
        href: settings.alibaba.storeUrl,
      },
    ].filter(Boolean) as { label: string; value: string; href?: string }[];

    const buffer = await renderToBuffer(
      createElement(CatalogPdf, {
        logo,
        siteUrl: absoluteUrl("/"),
        categoryName: category?.name,
        products: products.map((p, i) => ({
          ...p,
          image: images[i] ?? null,
          url: absoluteUrl(routes.product(p.slug)),
        })),
        contact,
        requestQuoteUrl: absoluteUrl(routes.requestQuote),
        generatedOn: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        // CatalogPdf renders a react-pdf <Document> at its root.
      }) as unknown as ReactElement<DocumentProps>,
    );

    const filename = `kishwour-catalogue${category ? `-${category.slug}` : ""}.pdf`;
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[catalog.pdf] generation failed", error);
    return new Response("The catalogue could not be generated. Please try again later.", {
      status: 500,
    });
  }
}
