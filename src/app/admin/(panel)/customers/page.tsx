import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader, EmptyRow, formatDate } from "@/components/admin/ui";
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
import { listCustomers } from "@/features/admin/inquiries/queries";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Customers" };

async function AdminCustomersPageBody(props: PageProps<"/admin/customers">) {
  await requireStaff("customers:view");
  const sp = await props.searchParams;
  const one = (k: string) =>
    typeof sp[k] === "string" ? (sp[k] as string).slice(0, 100) : undefined;
  const page = Math.max(1, Number(one("page")) || 1);
  const q = one("q");
  const country = one("country");
  const { items, total, totalPages } = await listCustomers({ q, country, page });
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (country) u.set("country", country);
    if (p > 1) u.set("page", String(p));
    return `/admin/customers${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Customers"
        description={`${total} buyer${total === 1 ? "" : "s"} — created and updated automatically from inquiries.`}
      />
      <form
        role="search"
        className="mb-4 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_10rem_auto]"
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, company or email"
          aria-label="Search customers"
        />
        <Input
          name="country"
          defaultValue={country}
          placeholder="Country (e.g. DE)"
          maxLength={2}
          aria-label="Country code"
        />
        <Button type="submit" variant="secondary">
          <Search aria-hidden /> Filter
        </Button>
      </form>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Inquiries</TableHead>
              <TableHead>Quotations</TableHead>
              <TableHead>Last inquiry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <EmptyRow colSpan={6}>No customers yet.</EmptyRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="font-medium hover:text-forest"
                    >
                      {c.contactPerson ?? c.companyName ?? c.email}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{c.email}</span>
                  </TableCell>
                  <TableCell>{c.companyName ?? "—"}</TableCell>
                  <TableCell>{c.country ?? "—"}</TableCell>
                  <TableCell>{c.inquiries}</TableCell>
                  <TableCell>{c.quotations}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(c.lastInquiryAt)}
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

export default function AdminCustomersPage(props: PageProps<"/admin/customers">) {
  return (
    <AdminBoundary>
      <AdminCustomersPageBody {...props} />
    </AdminBoundary>
  );
}
