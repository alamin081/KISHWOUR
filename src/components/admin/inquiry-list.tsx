import { Search } from "lucide-react";
import Link from "next/link";

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
import { type InquiryType } from "@/generated/prisma/client";
import {
  getStaffOptions,
  INQUIRY_STATUSES,
  listAdminInquiries,
} from "@/features/admin/inquiries/queries";

import { INQUIRY_SOURCE_LABELS } from "@/features/inquiries/status";

import { selectClass } from "./form-fields";
import { EmptyRow, formatDate, StatusBadge } from "./ui";

/** Filterable inquiry table, shared by Inquiries and Sample requests. */
export async function InquiryList({
  basePath,
  searchParams,
  fixedType,
}: {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  fixedType?: InquiryType;
}) {
  const one = (k: string) =>
    typeof searchParams[k] === "string"
      ? (searchParams[k] as string).slice(0, 100)
      : undefined;
  const page = Math.max(1, Number(one("page")) || 1);
  const filters = {
    status: one("status"),
    q: one("q"),
    country: one("country"),
    assignee: one("assignee"),
    source: one("source"),
    type: fixedType ?? (one("type") as InquiryType | undefined),
    page,
  };
  const [{ items, total, totalPages }, staff] = await Promise.all([
    listAdminInquiries(filters),
    getStaffOptions(),
  ]);
  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    for (const k of ["status", "q", "country", "assignee", "source", "type"] as const) {
      const v = filters[k];
      if (v && !(k === "type" && fixedType)) u.set(k, v);
    }
    if (p > 1) u.set("page", String(p));
    return `${basePath}${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <form
        role="search"
        className="mb-4 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 xl:grid-cols-[1fr_10rem_8rem_11rem_9rem_9rem_auto]"
      >
        <Input
          name="q"
          defaultValue={filters.q}
          placeholder="Search customer, company, email or reference"
          aria-label="Search customer"
        />
        <select
          name="status"
          defaultValue={filters.status ?? ""}
          className={selectClass}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          {INQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ").toLowerCase()}
            </option>
          ))}
        </select>
        <Input
          name="country"
          defaultValue={filters.country}
          placeholder="Country (e.g. DE)"
          maxLength={2}
          aria-label="Country code"
        />
        <select
          name="assignee"
          defaultValue={filters.assignee ?? ""}
          className={selectClass}
          aria-label="Assigned to"
        >
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name ?? s.email}
            </option>
          ))}
        </select>
        <select
          name="source"
          defaultValue={filters.source ?? ""}
          className={selectClass}
          aria-label="Source"
        >
          <option value="">All sources</option>
          {Object.entries(INQUIRY_SOURCE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        {fixedType ? (
          <span className="hidden xl:block" />
        ) : (
          <select
            name="type"
            defaultValue={filters.type ?? ""}
            className={selectClass}
            aria-label="Type"
          >
            <option value="">All types</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="OEM_ODM">OEM / ODM</option>
            <option value="SAMPLE_REQUEST">Sample request</option>
            <option value="GENERAL">General</option>
          </select>
        )}
        <Button type="submit" variant="secondary">
          <Search aria-hidden /> Filter
        </Button>
      </form>

      <p className="mb-2 text-sm text-muted-foreground">
        {total} result{total === 1 ? "" : "s"}
      </p>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Country</TableHead>
              {fixedType ? null : <TableHead>Type</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <EmptyRow colSpan={fixedType ? 6 : 7}>No inquiries found.</EmptyRow>
            ) : (
              items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <Link
                      href={`/admin/inquiries/${i.id}`}
                      className="font-mono text-xs text-forest hover:underline"
                    >
                      {i.inquiryNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{i.contactPerson}</span>
                    <span className="block text-xs text-muted-foreground">
                      {i.companyName ?? i.email}
                    </span>
                  </TableCell>
                  <TableCell>{i.country}</TableCell>
                  {fixedType ? null : (
                    <TableCell className="text-xs">
                      {i.inquiryType.replaceAll("_", " ").toLowerCase()}
                    </TableCell>
                  )}
                  <TableCell>
                    <StatusBadge status={i.status} />
                  </TableCell>
                  <TableCell className="text-xs">
                    {i.assignedTo ? (i.assignedTo.name ?? i.assignedTo.email) : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(i.createdAt)}
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
