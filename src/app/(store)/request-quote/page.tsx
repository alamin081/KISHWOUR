import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { BuyerInquiryForm } from "@/components/forms/buyer-inquiry-form";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/site";
import { getProductBySlug } from "@/features/products/queries";
import { whatsAppLink } from "@/features/products/links";
import { getSiteSettings } from "@/features/settings/queries";
import { COUNTRY_OPTIONS } from "@/lib/data/countries";

export const metadata: Metadata = {
  title: "Request a Quote",
  description:
    "Request a wholesale or custom-manufacturing (OEM/ODM) quotation from Kishwour.",
  alternates: { canonical: routes.requestQuote },
};

async function QuoteForm({
  searchParams,
}: {
  searchParams: PageProps<"/request-quote">["searchParams"];
}) {
  const sp = await searchParams;
  const slug = typeof sp["product"] === "string" ? sp["product"] : undefined;
  const type =
    typeof sp["type"] === "string" && sp["type"].toLowerCase() === "oem_odm"
      ? "OEM_ODM"
      : "WHOLESALE";
  const product =
    slug && /^[a-z0-9-]{1,120}$/.test(slug)
      ? await getProductBySlug(slug).catch(() => null)
      : null;
  return (
    <BuyerInquiryForm
      kind="quote"
      countries={COUNTRY_OPTIONS}
      defaultQuoteType={type}
      product={
        product ? { slug: product.slug, name: product.name, sku: product.sku } : null
      }
    />
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6 rounded-xl border bg-card p-6 sm:p-8" aria-hidden>
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="ml-auto h-12 w-48" />
    </div>
  );
}

export default async function RequestQuotePage(props: PageProps<"/request-quote">) {
  const { contact } = await getSiteSettings();
  const wa = contact.whatsapp
    ? whatsAppLink(contact.whatsapp, "Hello Kishwour, I would like a quotation.")
    : null;
  return (
    <>
      <PageHeader
        eyebrow="Wholesale & export"
        title="Request a Quote"
        description="Tell us about the products, quantities and destination you have in mind. We reply by email."
      >
        <Breadcrumbs items={[{ label: "Request a Quote", href: routes.requestQuote }]} />
      </PageHeader>
      <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
        <section aria-label="Quotation form">
          <Suspense fallback={<FormSkeleton />}>
            <QuoteForm searchParams={props.searchParams} />
          </Suspense>
        </section>
        <aside className="space-y-6 lg:pt-2">
          <h2 className="text-2xl">What to include</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Product or product type, and any reference links or designs</li>
            <li>Approximate quantity per item</li>
            <li>Destination country or port</li>
            <li>Customisation: materials, colours, sizes, branding, packaging</li>
            <li>Your timeline</li>
          </ul>
          <p className="text-sm">
            Need a sample first?{" "}
            <a
              href={routes.requestSample}
              className="font-semibold text-forest hover:underline"
            >
              Request a sample
            </a>
          </p>
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
            >
              <MessageCircle className="size-4" aria-hidden /> Prefer WhatsApp? Message us
            </a>
          ) : null}
        </aside>
      </div>
    </>
  );
}
