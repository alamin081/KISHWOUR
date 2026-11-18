import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QuotationForm } from "@/components/admin/quotation-form";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader } from "@/components/admin/ui";
import {
  getInquiryForQuotation,
  getProductOptionsForQuotes,
} from "@/features/admin/quotations/queries";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New quotation" };

/** Default validity: 30 days from today (YYYY-MM-DD). */
function defaultValidityDate(days = 30): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

async function NewQuotationPageBody(props: PageProps<"/admin/quotations/new">) {
  await requireStaff("quotations:manage");
  const sp = await props.searchParams;
  const inquiryId = typeof sp["inquiry"] === "string" ? sp["inquiry"] : null;
  if (!inquiryId) {
    return (
      <>
        <AdminPageHeader
          title="New quotation"
          back={{ href: "/admin/quotations", label: "Quotations" }}
        />
        <p className="text-sm">
          Quotations are created from an inquiry. Open an{" "}
          <Link href="/admin/inquiries" className="text-forest underline">
            inquiry
          </Link>{" "}
          and choose “Create quotation”.
        </p>
      </>
    );
  }
  const [inquiry, products] = await Promise.all([
    getInquiryForQuotation(inquiryId),
    getProductOptionsForQuotes(),
  ]);
  if (!inquiry) notFound();
  const first = inquiry.items[0]?.product;
  const validity = defaultValidityDate();

  return (
    <>
      <AdminPageHeader
        title="New quotation"
        description={`For ${inquiry.companyName ?? inquiry.contactPerson} · inquiry ${inquiry.inquiryNumber}`}
        back={{ href: `/admin/inquiries/${inquiry.id}`, label: inquiry.inquiryNumber }}
      />
      <QuotationForm
        quotationId={null}
        products={products.map((p) => ({
          ...p,
          priceMin: p.priceMin?.toString() ?? null,
        }))}
        defaultValues={{
          inquiryId: inquiry.id,
          status: "DRAFT",
          currency: first?.currency ?? "USD",
          incoterm: first?.incoterm ?? "FOB",
          shippingTerms: "",
          paymentTerms: "",
          leadTime: "",
          validityDate: validity,
          shippingCost: "0",
          notes: "",
          items: inquiry.items.length
            ? inquiry.items.map((it) => ({
                productId: it.productId ?? "",
                description: it.productName,
                quantity: String(
                  it.requestedQuantity ?? it.product?.minimumOrderQuantity ?? 1,
                ),
                moq: it.product?.minimumOrderQuantity
                  ? String(it.product.minimumOrderQuantity)
                  : "",
                unit: it.product?.unit ?? "pieces",
                unitPrice: it.product?.priceMin?.toString() ?? "",
              }))
            : [
                {
                  productId: "",
                  description: "",
                  quantity: "1",
                  moq: "",
                  unit: "pieces",
                  unitPrice: "",
                },
              ],
        }}
      />
    </>
  );
}

export default function NewQuotationPage(props: PageProps<"/admin/quotations/new">) {
  return (
    <AdminBoundary>
      <NewQuotationPageBody {...props} />
    </AdminBoundary>
  );
}
