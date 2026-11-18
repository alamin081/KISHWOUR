import type { Metadata } from "next";
import { Suspense } from "react";

import { BuyerInquiryForm } from "@/components/forms/buyer-inquiry-form";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/site";
import { getProductBySlug } from "@/features/products/queries";
import { COUNTRY_OPTIONS } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "Request a Sample",
  description: "Request product samples from Kishwour before placing a wholesale order.",
  alternates: { canonical: routes.requestSample },
};

async function SampleForm({
  searchParams,
}: {
  searchParams: PageProps<"/request-sample">["searchParams"];
}) {
  const sp = await searchParams;
  const slug = typeof sp["product"] === "string" ? sp["product"] : undefined;
  const product =
    slug && /^[a-z0-9-]{1,120}$/.test(slug)
      ? await getProductBySlug(slug).catch(() => null)
      : null;
  return (
    <BuyerInquiryForm
      kind="sample"
      countries={COUNTRY_OPTIONS}
      product={
        product ? { slug: product.slug, name: product.name, sku: product.sku } : null
      }
    />
  );
}

export default function RequestSamplePage(props: PageProps<"/request-sample">) {
  return (
    <>
      <PageHeader
        eyebrow="Samples"
        title="Request a Sample"
        description="Evaluate quality and design before ordering in bulk. We confirm availability, cost and shipping by email before anything is sent."
      >
        <Breadcrumbs
          items={[{ label: "Request a Sample", href: routes.requestSample }]}
        />
      </PageHeader>
      <div className="container-page max-w-3xl py-14 sm:py-20">
        <Suspense
          fallback={
            <div
              className="grid gap-5 rounded-xl border bg-card p-8 sm:grid-cols-2"
              aria-hidden
            >
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          }
        >
          <SampleForm searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}
