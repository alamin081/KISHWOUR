import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { selectClass } from "@/components/admin/form-fields";
import {
  AdminPageHeader,
  EmptyRow,
  formatDate,
  StatusBadge,
} from "@/components/admin/ui";
import { Pagination } from "@/components/products/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listQuotations, QUOTATION_STATUSES } from "@/features/admin/quotations/queries";
import { requireStaff } from "@/lib/auth/session";
import { AdminBoundary } from "@/components/admin/suspense-boundary";

export const metadata: Metadata = { title: "Quotations" };

async function AdminQuotationsPageBody(props: PageProps<"/admin/quotations">) {
  await requireStaff("quotations:manage");
  const sp = await props.searchParams;
  const one = (k: string) =>
    typeof sp[k] === "string" ? (sp[k] as string).slice(0, 100) : undefined;
  const page = Math.max(1, Number(one("page")) || 1);
  const status = one("status");
  const q = one("q");
  const { items, total, totalPages } = await listQuotations({ status, q, page });
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (status) u.set("status", status);
    if (q) u.set("q", q);
    if (p > 1) u.set("page", String(p));
    return `/admin/quotations${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Quotations"
        description="Create a quotation from an inquiry (Inquiries → open → Create quotation)."
      />
      <form
        role="search"
        className="mb-4 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_12rem_auto]"
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search number, customer or company"
          aria-label="Search quotations"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className={selectClass}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          {QUOTATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          <Search aria-hidden /> Filter
        </Button>
      </form>
      <p className="mb-2 text-sm text-muted-foreground">
        {total} quotation{total === 1 ? "" : "s"}
      </p>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Inquiry</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <EmptyRow colSpan={7}>No quotations yet.</EmptyRow>
            ) : (
              items.map((qt) => (
                <TableRow key={qt.id}>
                  <TableCell>
                    <Link
                      href={`/admin/quotations/${qt.id}`}
                      className="font-mono text-xs text-forest hover:underline"
                    >
                      {qt.quotationNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {qt.inquiry.companyName ?? qt.inquiry.contactPerson}
                    <span className="block text-xs text-muted-foreground">
                      {qt.inquiry.country}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/inquiries/${qt.inquiry.id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {qt.inquiry.inquiryNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {qt.currency} {qt.totalAmount.toString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={qt.status} />
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(qt.validityDate)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(qt.updatedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}

export default function AdminQuotationsPage(props: PageProps<"/admin/quotations">) {
  return (
    <AdminBoundary>
      <AdminQuotationsPageBody {...props} />
    </AdminBoundary>
  );
}
