import {
  Boxes,
  CheckCircle2,
  FileText,
  FlaskConical,
  FolderTree,
  Inbox,
  Hourglass,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BarList, ColumnChart } from "@/components/admin/bar-chart";
import {
  AdminPageHeader,
  EmptyRow,
  formatDate,
  Panel,
  StatCard,
  StatusBadge,
} from "@/components/admin/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardStats } from "@/features/admin/dashboard-queries";
import { requireStaff } from "@/lib/auth/session";
import { AdminBoundary } from "@/components/admin/suspense-boundary";

export const metadata: Metadata = { title: "Dashboard" };

async function AdminDashboardPageBody(props: PageProps<"/admin">) {
  await requireStaff("dashboard:view");
  const [{ totals, byStatus, monthlySeries, recent }, sp] = await Promise.all([
    getDashboardStats(),
    props.searchParams,
  ]);

  return (
    <>
      <AdminPageHeader title="Dashboard" description="Live figures from the database." />
      {sp["denied"] ? (
        <p
          role="alert"
          className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          You do not have permission to open that section.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total products"
          value={totals.totalProducts}
          icon={Boxes}
          href="/admin/products"
        />
        <StatCard
          label="Active products"
          value={totals.activeProducts}
          icon={CheckCircle2}
          href="/admin/products?status=active"
          hint="Published on the website"
        />
        <StatCard
          label="Categories"
          value={totals.totalCategories}
          icon={FolderTree}
          href="/admin/categories"
        />
        <StatCard
          label="Customers"
          value={totals.totalCustomers}
          icon={Users}
          href="/admin/customers"
          hint="Unique buyers who sent inquiries"
        />
        <StatCard
          label="Total inquiries"
          value={totals.totalInquiries}
          icon={Inbox}
          href="/admin/inquiries"
        />
        <StatCard
          label="Pending inquiries"
          value={totals.pendingInquiries}
          icon={Hourglass}
          href="/admin/inquiries?status=NEW"
          hint="New or in review"
        />
        <StatCard
          label="Active quotations"
          value={totals.activeQuotations}
          icon={FileText}
          href="/admin/quotations"
          hint="Draft or sent"
        />
        <StatCard
          label="Open sample requests"
          value={totals.openSampleRequests}
          icon={FlaskConical}
          href="/admin/samples"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Inquiries per month" description="Last 6 months, excluding spam">
          <ColumnChart
            title="Inquiries per month"
            data={monthlySeries}
            valueLabel="inquiries"
          />
        </Panel>
        <Panel title="Inquiries by status">
          {byStatus.length > 0 ? (
            <BarList
              data={byStatus.map((s) => ({
                ...s,
                label: s.label
                  .replaceAll("_", " ")
                  .toLowerCase()
                  .replace(/^\w/, (c) => c.toUpperCase()),
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No inquiries yet.</p>
          )}
        </Panel>
      </div>

      <Panel
        title="Latest inquiries"
        className="mt-6"
        actions={
          <Link
            href="/admin/inquiries"
            className="text-sm font-medium text-forest hover:underline"
          >
            View all
          </Link>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length === 0 ? (
                <EmptyRow colSpan={6}>No inquiries yet.</EmptyRow>
              ) : (
                recent.map((i) => (
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
                      {i.companyName
                        ? `${i.contactPerson} · ${i.companyName}`
                        : i.contactPerson}
                    </TableCell>
                    <TableCell>{i.country}</TableCell>
                    <TableCell>
                      {i.inquiryType.replaceAll("_", " ").toLowerCase()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} />
                    </TableCell>
                    <TableCell>{formatDate(i.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </>
  );
}

export default function AdminDashboardPage(props: PageProps<"/admin">) {
  return (
    <AdminBoundary>
      <AdminDashboardPageBody {...props} />
    </AdminBoundary>
  );
}
