import "server-only";

import { type Prisma, type QuotationStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";

export const QUOTATION_STATUSES: QuotationStatus[] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
];

export async function listQuotations(f: { status?: string; q?: string; page: number }) {
  const where: Prisma.QuotationWhereInput = {
    ...(f.status && (QUOTATION_STATUSES as string[]).includes(f.status)
      ? { status: f.status as QuotationStatus }
      : {}),
    ...(f.q
      ? {
          OR: [
            { quotationNumber: { contains: f.q, mode: "insensitive" } },
            { inquiry: { contactPerson: { contains: f.q, mode: "insensitive" } } },
            { inquiry: { companyName: { contains: f.q, mode: "insensitive" } } },
            { inquiry: { email: { contains: f.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [total, items] = await Promise.all([
    db.quotation.count({ where }),
    db.quotation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (f.page - 1) * 25,
      take: 25,
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        currency: true,
        totalAmount: true,
        validityDate: true,
        sentAt: true,
        updatedAt: true,
        inquiry: {
          select: {
            id: true,
            inquiryNumber: true,
            contactPerson: true,
            companyName: true,
            country: true,
          },
        },
      },
    }),
  ]);
  return { total, items, totalPages: Math.max(1, Math.ceil(total / 25)) };
}

export async function getQuotation(id: string) {
  return db.quotation.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      inquiry: {
        select: {
          id: true,
          inquiryNumber: true,
          contactPerson: true,
          companyName: true,
          email: true,
          country: true,
        },
      },
    },
  });
}

export async function getInquiryForQuotation(id: string) {
  return db.inquiry.findUnique({
    where: { id },
    select: {
      id: true,
      inquiryNumber: true,
      contactPerson: true,
      companyName: true,
      email: true,
      items: {
        select: {
          productId: true,
          productName: true,
          requestedQuantity: true,
          product: {
            select: {
              unit: true,
              minimumOrderQuantity: true,
              currency: true,
              incoterm: true,
              priceMin: true,
            },
          },
        },
      },
    },
  });
}

export async function getProductOptionsForQuotes() {
  return db.product.findMany({
    orderBy: { name: "asc" },
    take: 1000,
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      minimumOrderQuantity: true,
      priceMin: true,
    },
  });
}
