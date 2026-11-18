import { FilePlus2, Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InquiryUpdateForm } from "@/components/admin/inquiry-update-form";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader, formatDate, Panel, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";
import { getInquiryDetail, getStaffOptions } from "@/features/admin/inquiries/queries";
import { INQUIRY_SOURCE_LABELS } from "@/features/inquiries/status";
import { countryName } from "@/features/products/format";
import { whatsAppLink } from "@/features/products/links";
import { isEmailConfigured } from "@/lib/email";
import { can } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Inquiry" };

async function AdminInquiryPageBody(props: PageProps<"/admin/inquiries/[id]">) {
  const staff = await requireStaff("inquiries:manage");
  const { id } = await props.params;
  const [inquiry, staffOptions] = await Promise.all([
    getInquiryDetail(id),
    getStaffOptions(),
  ]);
  if (!inquiry) notFound();

  const rows: [string, React.ReactNode][] = [
    ["Contact person", inquiry.contactPerson],
    ["Company", inquiry.companyName ?? "—"],
    [
      "Email",
      <a key="e" href={`mailto:${inquiry.email}`} className="text-forest hover:underline">
        {inquiry.email}
      </a>,
    ],
    ["Phone", inquiry.phone ?? "—"],
    ["Country", `${countryName(inquiry.country)} (${inquiry.country})`],
    ["Website", inquiry.website ?? "—"],
    ["Business type", inquiry.businessType ?? "—"],
    ["Destination port", inquiry.destinationPort ?? "—"],
    ["Target price", inquiry.targetPrice ?? "—"],
    ["Required by", formatDate(inquiry.requiredBy)],
    ["Source", INQUIRY_SOURCE_LABELS[inquiry.source]],
    [
      "Buyer confirmation email",
      inquiry.buyerAckSentAt ? `Sent ${formatDate(inquiry.buyerAckSentAt)}` : "Not sent",
    ],
    [
      "Team notification email",
      inquiry.adminNotifiedAt
        ? `Sent ${formatDate(inquiry.adminNotifiedAt)}`
        : "Not sent",
    ],
    ["Received", formatDate(inquiry.createdAt)],
  ];

  return (
    <>
      <AdminPageHeader
        title={inquiry.inquiryNumber}
        description={`${inquiry.inquiryType.replaceAll("_", " ").toLowerCase()} inquiry`}
        back={{
          href:
            inquiry.inquiryType === "SAMPLE_REQUEST"
              ? "/admin/samples"
              : "/admin/inquiries",
          label:
            inquiry.inquiryType === "SAMPLE_REQUEST" ? "Sample requests" : "Inquiries",
        }}
        actions={
          <>
            <StatusBadge status={inquiry.status} />
            {can(staff.role, "quotations:manage") ? (
              <Button asChild size="sm">
                <Link href={`/admin/quotations/new?inquiry=${inquiry.id}`}>
                  <FilePlus2 aria-hidden /> Create quotation
                </Link>
              </Button>
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title={inquiry.subject ?? "Message"}>
            <p className="leading-relaxed whitespace-pre-line">{inquiry.message}</p>
          </Panel>
          {inquiry.customizationRequirements || inquiry.deliveryAddress ? (
            <Panel title="Requirements">
              {inquiry.customizationRequirements ? (
                <div className="mb-4">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Customisation
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-line">
                    {inquiry.customizationRequirements}
                  </p>
                </div>
              ) : null}
              {inquiry.deliveryAddress ? (
                <div>
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Delivery address
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-line">
                    {inquiry.deliveryAddress}
                  </p>
                </div>
              ) : null}
            </Panel>
          ) : null}
          {inquiry.items.length > 0 ? (
            <Panel title="Products requested">
              <ul className="divide-y">
                {inquiry.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span>
                      {it.product ? (
                        <a
                          href={routes.product(it.product.slug)}
                          target="_blank"
                          rel="noopener"
                          className="text-forest hover:underline"
                        >
                          {it.productName}
                        </a>
                      ) : (
                        `${it.productName} (product removed)`
                      )}
                      {it.product?.sku ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · SKU {it.product.sku}
                        </span>
                      ) : null}
                    </span>
                    <span>
                      {it.requestedQuantity ? `Qty ${it.requestedQuantity}` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
          <Panel title="Customer">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b py-1.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <a
                  href={`mailto:${inquiry.email}?subject=${encodeURIComponent(`Re: ${inquiry.inquiryNumber}`)}`}
                >
                  <Mail aria-hidden /> Email customer
                </a>
              </Button>
              {inquiry.phone ? (
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:${inquiry.phone.replace(/\s+/g, "")}`}>
                    <Phone aria-hidden /> Call
                  </a>
                </Button>
              ) : null}
              {inquiry.phone && whatsAppLink(inquiry.phone, "Hello") ? (
                <Button asChild size="sm" variant="outline">
                  <a
                    href={
                      whatsAppLink(
                        inquiry.phone,
                        `Hello ${inquiry.contactPerson}, this is Kishwour regarding your inquiry ${inquiry.inquiryNumber}.`,
                      ) ?? undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle aria-hidden /> WhatsApp
                  </a>
                </Button>
              ) : null}
              {inquiry.customerId ? (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/admin/customers/${inquiry.customerId}`}>
                    Customer history →
                  </Link>
                </Button>
              ) : null}
            </div>
          </Panel>
          <Panel title="Quotations">
            {inquiry.quotations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quotations yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {inquiry.quotations.map((q) => (
                  <li key={q.id} className="flex items-center justify-between gap-3 py-2">
                    <Link
                      href={`/admin/quotations/${q.id}`}
                      className="font-mono text-xs text-forest hover:underline"
                    >
                      {q.quotationNumber}
                    </Link>
                    <StatusBadge status={q.status} />
                    <span className="tabular-nums">
                      {q.currency} {q.totalAmount.toString()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(q.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <Panel title="Manage" className="h-fit lg:sticky lg:top-20">
          <InquiryUpdateForm
            id={inquiry.id}
            status={inquiry.status}
            source={inquiry.source}
            adminNotes={inquiry.adminNotes ?? ""}
            assignedToId={inquiry.assignedToId ?? ""}
            staff={staffOptions}
            emailConfigured={isEmailConfigured()}
          />
        </Panel>
      </div>
    </>
  );
}

export default function AdminInquiryPage(props: PageProps<"/admin/inquiries/[id]">) {
  return (
    <AdminBoundary>
      <AdminInquiryPageBody {...props} />
    </AdminBoundary>
  );
}
