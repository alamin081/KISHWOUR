"use server";

import { randomInt } from "node:crypto";

import {
  type ActionResult,
  failure,
  fieldErrorsFrom,
} from "@/features/admin/action-result";
import { Prisma } from "@/generated/prisma/client";
import { assertPermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { withTransaction } from "@/lib/db/transaction";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { getEmailBrand } from "@/lib/email/brand";
import { quotationEmail } from "@/lib/email/templates";

import { buildQuotationPdf } from "./pdf";
import {
  computeTotals,
  fromCents,
  type QuotationFormInput,
  quotationFormSchema,
} from "./schema";

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function quotationNumber() {
  const ymd = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  let s = "";
  for (let i = 0; i < 5; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `KSW-QT-${ymd}-${s}`;
}

export async function saveQuotation(
  id: string | null,
  input: QuotationFormInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertPermission("quotations:manage");
    const parsed = quotationFormSchema.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error),
      };
    const { items, validityDate, shippingCost, inquiryId, ...rest } = parsed.data;

    const inquiry = await db.inquiry.findUnique({
      where: { id: inquiryId },
      select: { id: true },
    });
    if (!inquiry) return { ok: false, message: "The inquiry no longer exists." };
    if (id) {
      const current = await db.quotation.findUnique({
        where: { id },
        select: { inquiryId: true },
      });
      if (!current) return { ok: false, message: "The quotation no longer exists." };
      if (current.inquiryId !== inquiryId)
        return { ok: false, message: "A quotation cannot be moved to another inquiry." };
    }

    const totals = computeTotals(items, shippingCost);
    const data = {
      ...rest,
      shippingCost,
      validityDate: validityDate ? new Date(`${validityDate}T00:00:00Z`) : null,
      subtotal: fromCents(totals.subtotal),
      totalAmount: fromCents(totals.total),
    };
    const lineData = items.map((it, i) => ({
      ...it,
      totalPrice: fromCents(totals.lines[i] ?? 0),
      sortOrder: i,
    }));

    const savedId = await withTransaction(async (tx) => {
      let qid = id;
      if (qid) {
        await tx.quotation.update({ where: { id: qid }, data });
      } else {
        for (let attempt = 0; attempt < 3 && !qid; attempt++) {
          try {
            qid = (
              await tx.quotation.create({
                data: { ...data, inquiryId, quotationNumber: quotationNumber() },
                select: { id: true },
              })
            ).id;
          } catch (e) {
            if (!(
              e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
            ))
              throw e;
          }
        }
        if (!qid) throw new Error("Could not allocate a quotation number");
      }
      await tx.quotationItem.deleteMany({ where: { quotationId: qid } });
      await tx.quotationItem.createMany({
        data: lineData.map((l) => ({ ...l, quotationId: qid })),
      });
      return qid;
    });
    return {
      ok: true,
      message: id ? "Quotation saved." : "Quotation created.",
      data: { id: savedId },
    };
  } catch (error) {
    return failure(error);
  }
}

export async function setQuotationStatus(
  id: string,
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED",
): Promise<ActionResult> {
  try {
    await assertPermission("quotations:manage");
    const q = await db.quotation.update({
      where: { id },
      data: { status },
      select: { inquiryId: true },
    });
    if (status === "ACCEPTED")
      await db.inquiry.update({
        where: { id: q.inquiryId },
        data: { status: "APPROVED" },
      });
    return { ok: true, message: `Quotation marked as ${status.toLowerCase()}.` };
  } catch (error) {
    return failure(error);
  }
}

/** Only drafts can be deleted; sent quotations are kept as a business record. */
export async function deleteQuotation(id: string): Promise<ActionResult> {
  try {
    await assertPermission("quotations:manage");
    const q = await db.quotation.findUnique({ where: { id }, select: { status: true } });
    if (!q) return { ok: false, message: "The quotation no longer exists." };
    if (q.status !== "DRAFT")
      return {
        ok: false,
        message:
          "Only draft quotations can be deleted. Mark others as expired or rejected instead.",
      };
    await db.quotation.delete({ where: { id } });
    return { ok: true, message: "Draft deleted." };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Emails the quotation PDF to the buyer via Resend (branded template: "sent" the first time,
 * "updated" when re-sent), then marks it as sent and moves the inquiry to QUOTATION_SENT.
 */
export async function sendQuotationEmail(id: string): Promise<ActionResult> {
  try {
    await assertPermission("quotations:manage");
    if (!isEmailConfigured()) {
      return {
        ok: false,
        message:
          "Email sending is not configured (RESEND_API_KEY and EMAIL_FROM). Download the PDF and send it manually.",
      };
    }
    const q = await db.quotation.findUnique({
      where: { id },
      select: {
        quotationNumber: true,
        inquiryId: true,
        sentAt: true,
        currency: true,
        totalAmount: true,
        validityDate: true,
        inquiry: {
          select: { email: true, contactPerson: true, inquiryNumber: true, status: true },
        },
      },
    });
    if (!q) return { ok: false, message: "The quotation no longer exists." };
    const pdf = await buildQuotationPdf(id);
    if (!pdf) return { ok: false, message: "The quotation no longer exists." };

    const mail = quotationEmail(await getEmailBrand(), {
      contactName: q.inquiry.contactPerson,
      inquiryNumber: q.inquiry.inquiryNumber,
      quotationNumber: q.quotationNumber,
      total: `${q.currency} ${Number(q.totalAmount.toString()).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      validUntil: q.validityDate
        ? q.validityDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })
        : null,
      updated: Boolean(q.sentAt),
    });
    await sendEmail({
      to: q.inquiry.email,
      ...mail,
      attachments: [{ filename: pdf.filename, content: pdf.buffer }],
    });

    await db.quotation.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
    if (["NEW", "REVIEWING", "CONTACTED"].includes(q.inquiry.status)) {
      await db.inquiry.update({
        where: { id: q.inquiryId },
        data: { status: "QUOTATION_SENT" },
      });
    }
    return {
      ok: true,
      message: `${q.sentAt ? "Updated quotation" : "Quotation"} emailed to ${q.inquiry.email}.`,
    };
  } catch (error) {
    return failure(
      error,
      error instanceof Error && error.message.startsWith("The email service")
        ? error.message
        : undefined,
    );
  }
}
