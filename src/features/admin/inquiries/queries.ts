import "server-only";

import {
  type InquirySource,
  type InquiryStatus,
  type InquiryType,
  type Prisma,
} from "@/generated/prisma/client";
import { INQUIRY_STATUS_VALUES } from "@/features/inquiries/status";
import { db } from "@/lib/db";

export const INQUIRY_STATUSES: InquiryStatus[] = INQUIRY_STATUS_VALUES;
export const PAGE_SIZE = 25;
export const INQUIRY_SOURCES: InquirySource[] = [
  "WEBSITE",
  "ALIBABA",
  "WHATSAPP",
  "EMAIL",
  "TRADE_SHOW",
  "REFERRAL",
  "OTHER",
];

export type InquiryFilters = {
  status?: string;
  type?: InquiryType;
  q?: string;
  country?: string;
  assignee?: string;
  source?: string;
  page: number;
};

export async function listAdminInquiries(f: InquiryFilters) {
  const where: Prisma.InquiryWhereInput = {
    ...(f.status && (INQUIRY_STATUSES as string[]).includes(f.status)
      ? { status: f.status as InquiryStatus }
      : {}),
    ...(f.type ? { inquiryType: f.type } : {}),
    ...(f.source && (INQUIRY_SOURCES as string[]).includes(f.source)
      ? { source: f.source as InquirySource }
      : {}),
    ...(f.country ? { country: f.country.toUpperCase().slice(0, 2) } : {}),
    ...(f.assignee === "unassigned"
      ? { assignedToId: null }
      : f.assignee
        ? { assignedToId: f.assignee }
        : {}),
    ...(f.q
      ? {
          OR: [
            { contactPerson: { contains: f.q, mode: "insensitive" } },
            { companyName: { contains: f.q, mode: "insensitive" } },
            { email: { contains: f.q, mode: "insensitive" } },
            { inquiryNumber: { contains: f.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    db.inquiry.count({ where }),
    db.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        inquiryNumber: true,
        inquiryType: true,
        status: true,
        contactPerson: true,
        companyName: true,
        email: true,
        country: true,
        createdAt: true,
        assignedTo: { select: { name: true, email: true } },
        _count: { select: { items: true, quotations: true } },
      },
    }),
  ]);
  return { total, items, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getInquiryDetail(id: string) {
  return db.inquiry.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { slug: true, sku: true } } } },
      quotations: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          quotationNumber: true,
          status: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
        },
      },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Active staff who can be assigned (never exposes password hashes). */
export async function getStaffOptions() {
  return db.user.findMany({
    where: { isActive: true, role: { in: ["ADMIN", "EDITOR"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

// ── Customers (Customer table, created/updated from every inquiry) ──────────

export async function listCustomers(f: { q?: string; country?: string; page: number }) {
  const where: Prisma.CustomerWhereInput = {
    ...(f.country ? { country: f.country.toUpperCase().slice(0, 2) } : {}),
    ...(f.q
      ? {
          OR: [
            { contactPerson: { contains: f.q, mode: "insensitive" } },
            { companyName: { contains: f.q, mode: "insensitive" } },
            { email: { contains: f.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        contactPerson: true,
        companyName: true,
        country: true,
        businessType: true,
        _count: { select: { inquiries: true } },
        inquiries: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ]);
  const quoteCounts = rows.length
    ? await db.$queryRaw<{ customerId: string; n: number }[]>`
        SELECT i."customerId", count(q.id)::int AS n FROM "Quotation" q JOIN "Inquiry" i ON i.id = q."inquiryId"
        WHERE i."customerId" = ANY(${rows.map((r) => r.id)}) GROUP BY i."customerId"`
    : [];
  const quotes = new Map(quoteCounts.map((r) => [r.customerId, Number(r.n)]));
  return {
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    items: rows.map(({ _count, inquiries, ...c }) => ({
      ...c,
      inquiries: _count.inquiries,
      quotations: quotes.get(c.id) ?? 0,
      lastInquiryAt: inquiries[0]?.createdAt ?? null,
    })),
  };
}

export async function getCustomer(id: string) {
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      inquiries: {
        orderBy: { createdAt: "desc" },
        include: {
          quotations: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              quotationNumber: true,
              status: true,
              totalAmount: true,
              currency: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });
  if (!customer) return null;
  return {
    ...customer,
    quotations: customer.inquiries.flatMap((i) =>
      i.quotations.map((q) => ({
        ...q,
        inquiryNumber: i.inquiryNumber,
        inquiryId: i.id,
      })),
    ),
  };
}
