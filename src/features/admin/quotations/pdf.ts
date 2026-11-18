import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { type DocumentProps, renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import { absoluteUrl } from "@/config/site";
import { countryName } from "@/features/products/format";
import { QuotationPdf } from "@/features/quotation-pdf/document";
import { getSiteSettings } from "@/features/settings/queries";

import { getQuotation } from "./queries";
import { computeTotals, fromCents } from "./schema";

const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/** Renders the quotation PDF from the database. Returns null if the quotation does not exist. */
export async function buildQuotationPdf(
  id: string,
): Promise<{ buffer: Buffer; filename: string; number: string } | null> {
  const [q, settings, logo] = await Promise.all([
    getQuotation(id),
    getSiteSettings(),
    readFile(path.join(process.cwd(), "public", "brand", "kishwour-logo.png")),
  ]);
  if (!q) return null;

  const items = q.items.map((i) => ({
    quantity: i.quantity,
    unitPrice: i.unitPrice.toString(),
  }));
  const totals = computeTotals(items, q.shippingCost.toString());
  const { email, phone, whatsapp, address } = settings.contact;

  const buffer = await renderToBuffer(
    createElement(QuotationPdf, {
      logo,
      siteUrl: absoluteUrl("/"),
      number: q.quotationNumber,
      date: fmt(q.sentAt ?? q.createdAt),
      validUntil: q.validityDate ? fmt(q.validityDate) : null,
      currency: q.currency,
      incoterm: q.incoterm,
      shippingTerms: q.shippingTerms,
      paymentTerms: q.paymentTerms,
      leadTime: q.leadTime,
      notes: q.notes,
      buyer: { ...q.inquiry, country: countryName(q.inquiry.country) },
      items: q.items.map((i, idx) => ({
        description: i.description,
        quantity: i.quantity,
        moq: i.moq,
        unit: i.unit,
        unitPrice: i.unitPrice.toString(),
        total: fromCents(totals.lines[idx] ?? 0),
      })),
      subtotal: fromCents(totals.subtotal),
      shippingCost: q.shippingCost.toString(),
      total: fromCents(totals.total),
      sellerContact: [
        email,
        phone,
        whatsapp ? `WhatsApp +${whatsapp}` : undefined,
        address,
      ].filter((v): v is string => Boolean(v)),
    }) as unknown as ReactElement<DocumentProps>,
  );
  return { buffer, filename: `${q.quotationNumber}.pdf`, number: q.quotationNumber };
}
