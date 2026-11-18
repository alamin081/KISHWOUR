import {
  ExternalLink,
  FlaskConical,
  MessageCircle,
  MessageSquareQuote,
  PackageCheck,
  Palette,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { absoluteUrl, routes, siteConfig } from "@/config/site";
import { formatPriceRange, formatQuantity } from "@/features/products/format";
import { isValidAlibabaUrl, whatsAppLink } from "@/features/products/links";
import { getRelatedProducts } from "@/features/products/queries";
import { getSiteSettings } from "@/features/settings/queries";
import { type ProductDetailData } from "@/features/products/types";

import { Breadcrumbs } from "../shared/breadcrumbs";
import { JsonLd } from "../shared/json-ld";
import { SectionHeading } from "../shared/section-heading";
import { ProductCard } from "./product-card";
import { ProductGallery } from "./product-gallery";
import { ProductSpecs } from "./product-specs";

/** Full product page: gallery, key facts, CTAs, specifications, variants, related products. */
export async function ProductDetail({ product }: { product: ProductDetailData }) {
  const [related, settings] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id, 4),
    getSiteSettings(),
  ]);
  const price = formatPriceRange(product.priceMin, product.priceMax, product.currency);
  const moq = formatQuantity(product.minimumOrderQuantity, product.unit);
  const url = absoluteUrl(routes.product(product.slug));
  const alibaba = isValidAlibabaUrl(product.alibabaUrl) ? product.alibabaUrl : null;
  const whatsapp = settings.contact.whatsapp
    ? whatsAppLink(
        settings.contact.whatsapp,
        `Hello Kishwour, I am interested in "${product.name}"${product.sku ? ` (SKU ${product.sku})` : ""}. ${url}`,
      )
    : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.shortDescription ?? product.description ?? undefined,
          sku: product.sku ?? undefined,
          image: product.images.map((i) => i.url),
          brand: { "@type": "Brand", name: siteConfig.name },
          category: product.category.name,
          material: product.material ?? undefined,
          url,
          ...(product.priceMin || product.priceMax
            ? {
                offers: {
                  "@type": "AggregateOffer",
                  priceCurrency: product.currency,
                  lowPrice: product.priceMin ?? product.priceMax,
                  highPrice: product.priceMax ?? product.priceMin,
                },
              }
            : {}),
        }}
      />
      <div className="container-page py-8 sm:py-12">
        <Breadcrumbs
          items={[
            { label: "Products", href: routes.products },
            {
              label: product.category.name,
              href: routes.category(product.category.slug),
            },
            { label: product.name, href: routes.product(product.slug) },
          ]}
        />
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} productName={product.name} />

          <div>
            <Link
              href={routes.category(product.category.slug)}
              className="text-xs font-semibold tracking-[0.18em] text-jute-deep uppercase hover:underline"
            >
              {product.category.name}
            </Link>
            <h1 className="mt-3 text-3xl sm:text-4xl">{product.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {[product.sku && `SKU ${product.sku}`, product.material]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {product.shortDescription ? (
              <p className="mt-5 text-lg leading-relaxed text-foreground/85">
                {product.shortDescription}
              </p>
            ) : null}

            <dl className="mt-8 grid gap-4 rounded-xl bg-secondary/50 p-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Wholesale price
                </dt>
                <dd className="mt-1 text-lg font-medium">
                  {price
                    ? `${price}${product.incoterm ? ` · ${product.incoterm}` : ""}`
                    : "On request"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Minimum order
                </dt>
                <dd className="mt-1 text-lg font-medium">{moq ?? "On request"}</dd>
              </div>
            </dl>

            {product.isCustomizable || product.sampleAvailable ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {product.isCustomizable ? (
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    <Palette className="size-3.5" aria-hidden /> Customisable
                  </li>
                ) : null}
                {product.sampleAvailable ? (
                  <li className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                    <PackageCheck className="size-3.5" aria-hidden /> Samples available
                  </li>
                ) : null}
              </ul>
            ) : null}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg">
                <Link href={routes.requestQuoteFor(product.slug)}>
                  <MessageSquareQuote aria-hidden /> Request a Quote
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href={routes.requestSampleFor(product.slug)}>
                  <FlaskConical aria-hidden /> Request a Sample
                </Link>
              </Button>
              {whatsapp ? (
                <Button asChild size="lg" variant="outline">
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle aria-hidden /> Contact via WhatsApp
                  </a>
                </Button>
              ) : null}
              {alibaba ? (
                <Button asChild size="lg" variant="outline">
                  <a href={alibaba} target="_blank" rel="noopener noreferrer">
                    View on Alibaba <ExternalLink aria-hidden />
                  </a>
                </Button>
              ) : null}
            </div>

            <section aria-labelledby="specs-heading" className="mt-10">
              <h2
                id="specs-heading"
                className="mb-4 font-sans text-sm font-semibold tracking-wide uppercase"
              >
                Specifications
              </h2>
              <ProductSpecs product={product} />
            </section>
          </div>
        </div>

        {product.variants.length > 0 ? (
          <section aria-labelledby="variants-heading" className="mt-16 border-t pt-12">
            <h2 id="variants-heading" className="text-2xl">
              Available variants
            </h2>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th scope="col" className="py-3 pr-4 font-semibold">
                      Variant
                    </th>
                    <th scope="col" className="py-3 pr-4 font-semibold">
                      SKU
                    </th>
                    <th scope="col" className="py-3 pr-4 font-semibold">
                      Colour
                    </th>
                    <th scope="col" className="py-3 pr-4 font-semibold">
                      Size
                    </th>
                    <th scope="col" className="py-3 font-semibold">
                      Material
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {product.variants.map((v) => (
                    <tr key={v.id}>
                      <th scope="row" className="py-3 pr-4 font-medium">
                        {v.name}
                      </th>
                      <td className="py-3 pr-4 font-mono text-xs">{v.sku ?? "—"}</td>
                      <td className="py-3 pr-4">{v.color ?? "—"}</td>
                      <td className="py-3 pr-4">{v.size ?? "—"}</td>
                      <td className="py-3">{v.material ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {product.description ||
        product.customizationOptions.length > 0 ||
        product.packagingDetails ? (
          <div className="mt-16 grid gap-10 border-t pt-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            {product.description ? (
              <section aria-labelledby="desc-heading">
                <h2 id="desc-heading" className="text-2xl">
                  Description
                </h2>
                <div className="mt-4 leading-relaxed whitespace-pre-line text-foreground/85">
                  {product.description}
                </div>
              </section>
            ) : (
              <div />
            )}
            <div className="space-y-8">
              {product.customizationOptions.length > 0 ? (
                <section aria-labelledby="custom-heading">
                  <h2 id="custom-heading" className="text-xl">
                    Customisation
                  </h2>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {product.customizationOptions.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {product.packagingDetails ? (
                <section aria-labelledby="packaging-heading">
                  <h2 id="packaging-heading" className="text-xl">
                    Packaging details
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {product.packagingDetails}
                  </p>
                </section>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {related.length > 0 ? (
        <section
          aria-labelledby="related-heading"
          className="bg-secondary/40 py-14 sm:py-20"
        >
          <div className="container-page">
            <h2 id="related-heading" className="sr-only">
              Related products
            </h2>
            <SectionHeading eyebrow={product.category.name} title="Related products" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
