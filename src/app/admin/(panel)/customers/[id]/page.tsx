import { Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader, formatDate, Panel, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { getCustomer } from "@/features/admin/inquiries/queries";
import { INQUIRY_SOURCE_LABELS } from "@/features/inquiries/status";
import { countryName } from "@/features/products/format";
import { whatsAppLink } from "@/features/products/links";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Customer" };

async function AdminCustomerPageBody(props: PageProps<"/admin/customers/[id]">) {
  await requireStaff("customers:view");
  const { id } = await props.params;
  const customer = await getCustomer(id.slice(0, 40));
  if (!customer) notFound();
  const wa = customer.phone
    ? whatsAppLink(
        customer.phone,
        `Hello ${customer.contactPerson ?? ""}, this is Kishwour.`,
      )
    : null;

  return (
    <>
      <AdminPageHeader
        title={customer.companyName ?? customer.contactPerson ?? customer.email}
        description={customer.email}
        back={{ href: "/admin/customers", label: "Customers" }}
        actions={
          <>
            <Button asChild size="sm" variant="outline">
              <a href={`mailto:${customer.email}`}>
                <Mail aria-hidden /> Email
              </a>
            </Button>
            {wa ? (
              <Button asChild size="sm" variant="outline">
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden /> WhatsApp
                </a>
              </Button>
            ) : null}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <Panel title="Company & contact" className="h-fit">
          <dl className="space-y-2 text-sm">
            {(
              [
                ["Company", customer.companyName ?? "—"],
                ["Contact person", customer.contactPerson ?? "—"],
                ["Email", customer.email],
                ["Phone", customer.phone ?? "—"],
                [
                  "Country",
                  customer.country
                    ? `${countryName(customer.country)} (${customer.country})`
                    : "—",
                ],
                ["Business type", customer.businessType ?? "—"],
                ["Website", customer.website ?? "—"],
                ["Last address", customer.address ?? "—"],
                ["Customer since", formatDate(customer.createdAt)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b py-1.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right break-all whitespace-pre-line">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <div className="space-y-6">
          <Panel title={`Inquiry history (${customer.inquiries.length})`}>
            <ul className="divide-y text-sm">
              {customer.inquiries.map((i) => (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-2"
                >
                  <Link
                    href={`/admin/inquiries/${i.id}`}
                    className="font-mono text-xs text-forest hover:underline"
                  >
                    {i.inquiryNumber}
                  </Link>
                  <span className="text-xs">
                    {i.inquiryType.replaceAll("_", " ").toLowerCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {INQUIRY_SOURCE_LABELS[i.source]}
                  </span>
                  <StatusBadge status={i.status} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(i.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={`Quotation history (${customer.quotations.length})`}>
            {customer.quotations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quotations yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {customer.quotations.map((q) => (
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
      </div>
    </>
  );
}

export default function AdminCustomerPage(props: PageProps<"/admin/customers/[id]">) {
  return (
    <AdminBoundary>
      <AdminCustomerPageBody {...props} />
    </AdminBoundary>
  );
}
