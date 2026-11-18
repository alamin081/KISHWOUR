import type { Metadata } from "next";
import { Suspense } from "react";

import { CatalogView } from "@/components/products/catalog-view";
import { CatalogSkeleton } from "@/components/products/skeletons";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHeader } from "@/components/shared/page-header";
import { routes } from "@/config/site";
import { parseProductListParams } from "@/features/products/schemas";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Wholesale catalogue of handmade footwear, jute products, bags, handicrafts and home décor from Bangladesh.",
  alternates: { canonical: routes.products },
};

async function Listing({
  searchParams,
}: {
  searchParams: PageProps<"/products">["searchParams"];
}) {
  const params = parseProductListParams(await searchParams);
  return <CatalogView params={params} />;
}

export default function ProductsPage(props: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Handmade in Bangladesh. Available for wholesale, private label and custom orders."
      >
        <Breadcrumbs items={[{ label: "Products", href: routes.products }]} />
      </PageHeader>
      <div className="container-page py-8 sm:py-12">
        <Suspense fallback={<CatalogSkeleton />}>
          <Listing searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}
