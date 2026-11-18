import "server-only";

import { db } from "@/lib/db";

import { FINISHED_STATUSES, PENDING_STATUSES } from "@/features/inquiries/status";

const OPEN_INQUIRY = PENDING_STATUSES;
const ACTIVE_QUOTATION = ["DRAFT", "SENT"] as const;
const CLOSED = FINISHED_STATUSES;

/** Live counts for the dashboard (no caching — staff expect current numbers). */
export async function getDashboardStats() {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 5, 1);
  since.setUTCHours(0, 0, 0, 0);

  const [
    totalProducts,
    activeProducts,
    totalCategories,
    customerRows,
    totalInquiries,
    pendingInquiries,
    activeQuotations,
    openSampleRequests,
    byStatus,
    monthly,
    recent,
  ] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { isActive: true } }),
    db.category.count(),
    db.customer.count(),
    db.inquiry.count({ where: { status: { not: "SPAM" } } }),
    db.inquiry.count({ where: { status: { in: [...OPEN_INQUIRY] } } }),
    db.quotation.count({ where: { status: { in: [...ACTIVE_QUOTATION] } } }),
    db.inquiry.count({
      where: { inquiryType: "SAMPLE_REQUEST", status: { notIn: [...CLOSED] } },
    }),
    db.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    db.$queryRaw<{ month: Date; n: number }[]>`
      SELECT date_trunc('month', "createdAt") AS month, count(*)::int AS n
      FROM "Inquiry" WHERE "createdAt" >= ${since} AND status <> 'SPAM'
      GROUP BY 1 ORDER BY 1`,
    db.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        inquiryNumber: true,
        contactPerson: true,
        companyName: true,
        country: true,
        inquiryType: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(since);
    d.setUTCMonth(since.getUTCMonth() + i);
    return d;
  });
  const monthlySeries = months.map((m) => ({
    label: m.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
    value:
      monthly.find(
        (r) =>
          new Date(r.month).getUTCMonth() === m.getUTCMonth() &&
          new Date(r.month).getUTCFullYear() === m.getUTCFullYear(),
      )?.n ?? 0,
  }));

  return {
    totals: {
      totalProducts,
      activeProducts,
      totalCategories,
      totalCustomers: customerRows,
      totalInquiries,
      pendingInquiries,
      activeQuotations,
      openSampleRequests,
    },
    byStatus: byStatus
      .map((s) => ({ label: s.status, value: s._count._all }))
      .sort((a, b) => b.value - a.value),
    monthlySeries,
    recent,
  };
}
