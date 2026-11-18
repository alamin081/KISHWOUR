import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CatalogView } from "@/components/products/catalog-view";
import { ProductDetail } from "@/components/products/product-detail";
import { CatalogSkeleton } from "@/components/products/skeletons";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/site";
import { getActiveCategories } from "@/features/categories/queries";
import { getProductBySlug } from "@/features/products/queries";
import { parseProductListParams } from "@/features/products/schemas";

/**
 * /products/<slug> serves BOTH category pages and product pages. Category slugs are resolved
 * first from the cached category list (no extra query); otherwise the product is loaded.
 * Product and category slugs must therefore never collide (enforced in the admin).
 */
async function resolve(slug: string) {
  const category = (await getActiveCategories()).find((c) => c.slug === slug);
  if (category) return { kind: "category" as const, category };
  const product = await getProductBySlug(slug);
  return product ? { kind: "product" as const, product } : null;
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const hit = await resolve(slug);
  if (!hit) return { title: "Not found", robots: { index: false } };

  if (hit.kind === "category") {
    const c = hit.category;
    const sp = await props.searchParams;
    const filtered = Object.keys(sp).some((k) => k !== "page");
    return {
      title: c.name,
      description:
        c.description ?? `${c.name} — handmade in Bangladesh, available for wholesale.`,
      alternates: { canonical: routes.category(c.slug) },
      // Filtered/sorted variants of a category page should not compete with the canonical page.
      ...(filtered ? { robots: { index: false, follow: true } } : {}),
    };
  }

  const p = hit.product;
  const description =
    p.seoDescription ?? p.shortDescription ?? `${p.name} — handmade in Bangladesh.`;
  return {
    title: p.seoTitle ?? p.name,
    description,
    alternates: { canonical: routes.product(p.slug) },
    openGraph: {
      title: p.name,
      description,
      images: p.images[0] ? [{ url: p.images[0].url, alt: p.images[0].alt }] : undefined,
    },
  };
}

async function SlugView({ params, searchParams }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const hit = await resolve(slug);
  if (!hit) notFound();

  if (hit.kind === "product") return <ProductDetail product={hit.product} />;

  const { category } = hit;
  const listParams = parseProductListParams(await searchParams);
  return (
    <>
      <PageHeader
        eyebrow="Category"
        title={category.name}
        description={category.description}
      >
        <Breadcrumbs
          items={[
            { label: "Products", href: routes.products },
            { label: category.name, href: routes.category(category.slug) },
          ]}
        />
      </PageHeader>
      <div className="container-page py-8 sm:py-12">
        <CatalogView params={listParams} categorySlug={category.slug} />
      </div>
    </>
  );
}

function SlugSkeleton() {
  return (
    <>
      <div className="border-b py-12" aria-hidden>
        <div className="container-page space-y-4">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      </div>
      <div className="container-page py-10">
        <CatalogSkeleton />
      </div>
    </>
  );
}

export default function ProductOrCategoryPage(props: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<SlugSkeleton />}>
      <SlugView {...props} />
    </Suspense>
  );
}
