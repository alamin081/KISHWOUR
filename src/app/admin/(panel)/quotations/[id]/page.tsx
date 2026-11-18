import { FileDown, Send } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ActionButton, ConfirmButton } from "@/components/admin/action-buttons";
import { QuotationForm } from "@/components/admin/quotation-form";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader, formatDate, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { deleteQuotation, sendQuotationEmail } from "@/features/admin/quotations/actions";
import {
  getProductOptionsForQuotes,
  getQuotation,
} from "@/features/admin/quotations/queries";
import { requireStaff } from "@/lib/auth/session";
import { isEmailConfigured } from "@/lib/email";

export const metadata: Metadata = { title: "Quotation" };

async function QuotationPageBody(props: PageProps<"/admin/quotations/[id]">) {
  await requireStaff("quotations:manage");
  const { id } = await props.params;
  const [q, products] = await Promise.all([
    getQuotation(id),
    getProductOptionsForQuotes(),
  ]);
  if (!q) notFound();
  const emailReady = isEmailConfigured();

  return (
    <>
      <AdminPageHeader
        title={q.quotationNumber}
        description={`${q.inquiry.companyName ?? q.inquiry.contactPerson} · ${q.inquiry.email}${q.sentAt ? ` · sent ${formatDate(q.sentAt)}` : ""}`}
        back={{
          href: `/admin/inquiries/${q.inquiry.id}`,
          label: q.inquiry.inquiryNumber,
        }}
        actions={
          <>
            <StatusBadge status={q.status} />
            <Button asChild size="sm" variant="outline">
              <a href={`/admin/quotations/${q.id}/pdf`} target="_blank" rel="noopener">
                <FileDown aria-hidden /> PDF
              </a>
            </Button>
            <ActionButton
              size="sm"
              run={sendQuotationEmail.bind(null, q.id)}
              disabled={!emailReady}
              title={emailReady ? undefined : "Email is not configured"}
            >
              <Send aria-hidden /> Send by email
            </ActionButton>
            {q.status === "DRAFT" ? (
              <ConfirmButton
                size="sm"
                variant="outline"
                className="text-destructive"
                run={deleteQuotation.bind(null, q.id)}
                redirectTo="/admin/quotations"
                title="Delete this draft?"
                description="The draft quotation and its lines are deleted permanently."
                confirmLabel="Delete draft"
              >
                Delete draft
              </ConfirmButton>
            ) : null}
          </>
        }
      />
      {!emailReady ? (
        <p className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Email sending is not configured (RESEND_API_KEY and EMAIL_FROM). Download the
          PDF and send it manually until it is set up.
        </p>
      ) : null}
      <QuotationForm
        quotationId={q.id}
        products={products.map((p) => ({
          ...p,
          priceMin: p.priceMin?.toString() ?? null,
        }))}
        defaultValues={{
          inquiryId: q.inquiry.id,
          status: q.status,
          currency: q.currency,
          incoterm: q.incoterm ?? "",
          shippingTerms: q.shippingTerms ?? "",
          paymentTerms: q.paymentTerms ?? "",
          leadTime: q.leadTime ?? "",
          validityDate: q.validityDate ? q.validityDate.toISOString().slice(0, 10) : "",
          shippingCost: q.shippingCost.toString(),
          notes: q.notes ?? "",
          items: q.items.map((i) => ({
            productId: i.productId ?? "",
            description: i.description,
            quantity: String(i.quantity),
            moq: i.moq ? String(i.moq) : "",
            unit: i.unit,
            unitPrice: i.unitPrice.toString(),
          })),
        }}
      />
    </>
  );
}

export default function QuotationPage(props: PageProps<"/admin/quotations/[id]">) {
  return (
    <AdminBoundary>
      <QuotationPageBody {...props} />
    </AdminBoundary>
  );
}
