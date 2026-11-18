"use server";

import { z } from "zod";

import {
  type ActionResult,
  failure,
  fieldErrorsFrom,
} from "@/features/admin/action-result";
import { generateInquiryNumber } from "@/features/inquiries/inquiry-number";
import {
  INQUIRY_STATUS_VALUES,
  type InquiryStatusValue,
} from "@/features/inquiries/status";
import { Prisma } from "@/generated/prisma/client";
import { assertPermission } from "@/lib/auth/session";
import { COUNTRY_CODES } from "@/lib/data/countries";
import { db } from "@/lib/db";
import { withTransaction } from "@/lib/db/transaction";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { getEmailBrand } from "@/lib/email/brand";
import { inquiryStatusEmail } from "@/lib/email/templates";
import { emailSchema } from "@/lib/validations/common";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

const updateSchema = z.object({
  status: z.enum(INQUIRY_STATUS_VALUES as [InquiryStatusValue, ...InquiryStatusValue[]]),
  adminNotes: text(10_000),
  assignedToId: text(40),
  source: z.enum([
    "WEBSITE",
    "ALIBABA",
    "WHATSAPP",
    "EMAIL",
    "TRADE_SHOW",
    "REFERRAL",
    "OTHER",
  ]),
  notifyBuyer: z.boolean().optional(),
  /** Optional message to the buyer included in the status email (never the internal notes). */
  buyerNote: text(1000),
});

export type InquiryUpdateInput = z.input<typeof updateSchema>;

/** Statuses a buyer may be emailed about. */
const NOTIFIABLE: InquiryStatusValue[] = [
  "REVIEWING",
  "CONTACTED",
  "QUOTATION_SENT",
  "NEGOTIATION",
  "APPROVED",
  "REJECTED",
  "CLOSED",
];

/** Status, source, assignee and internal notes; optionally emails the buyer about the new status. */
export async function updateInquiry(
  id: string,
  input: InquiryUpdateInput,
): Promise<ActionResult> {
  try {
    await assertPermission("inquiries:manage");
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error),
      };
    const { notifyBuyer, buyerNote, ...data } = parsed.data;
    if (data.assignedToId) {
      const staff = await db.user.findFirst({
        where: {
          id: data.assignedToId,
          isActive: true,
          role: { in: ["ADMIN", "EDITOR"] },
        },
        select: { id: true },
      });
      if (!staff)
        return {
          ok: false,
          message: "Choose an active staff member.",
          fieldErrors: { assignedToId: "Invalid staff member" },
        };
    }
    const before = await db.inquiry.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!before) return { ok: false, message: "The inquiry no longer exists." };
    const inquiry = await db.inquiry.update({
      where: { id },
      data,
      select: { inquiryNumber: true, email: true, contactPerson: true },
    });

    if (!notifyBuyer) return { ok: true, message: "Inquiry updated." };
    if (!NOTIFIABLE.includes(data.status))
      return {
        ok: true,
        message: `Inquiry updated. No email sent — buyers are not notified about “${data.status.toLowerCase()}”.`,
      };
    if (!isEmailConfigured())
      return {
        ok: true,
        message: "Inquiry updated. No email sent — email is not configured.",
      };
    try {
      const mail = inquiryStatusEmail(await getEmailBrand(), {
        contactName: inquiry.contactPerson,
        inquiryNumber: inquiry.inquiryNumber,
        status: data.status,
        note: buyerNote,
      });
      await sendEmail({ to: inquiry.email, ...mail });
      return { ok: true, message: `Inquiry updated and ${inquiry.email} notified.` };
    } catch (error) {
      console.error("[inquiry] status email failed", error);
      return {
        ok: false,
        message: "Inquiry updated, but the status email could not be sent.",
      };
    }
  } catch (error) {
    return failure(error);
  }
}

const manualSchema = z.object({
  source: z.enum(["ALIBABA", "WHATSAPP", "EMAIL", "TRADE_SHOW", "REFERRAL", "OTHER"]),
  inquiryType: z.enum(["WHOLESALE", "OEM_ODM", "SAMPLE_REQUEST", "GENERAL"]),
  contactPerson: z.string().trim().min(2, "Enter the contact name").max(120),
  companyName: text(160),
  email: emailSchema,
  phone: text(30),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => COUNTRY_CODES.has(v), "Choose a country"),
  product: text(160),
  productSku: text(64),
  requestedQuantity: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(10_000_000)])
    .nullish()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  message: z.string().trim().min(5, "Enter the request").max(10_000),
  deliveryAddress: text(1000),
});

export type ManualInquiryInput = z.input<typeof manualSchema>;

/** Records an inquiry received outside the website (Alibaba, WhatsApp, email…). No emails are sent. */
export async function createManualInquiry(
  input: ManualInquiryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const staff = await assertPermission("inquiries:manage");
    const parsed = manualSchema.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error),
      };
    const d = parsed.data;
    const id = await withTransaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email: d.email },
        create: {
          email: d.email,
          companyName: d.companyName,
          contactPerson: d.contactPerson,
          phone: d.phone,
          country: d.country,
          address: d.deliveryAddress,
        },
        update: {
          contactPerson: d.contactPerson,
          country: d.country,
          ...(d.companyName ? { companyName: d.companyName } : {}),
          ...(d.phone ? { phone: d.phone } : {}),
        },
        select: { id: true },
      });
      let created: { id: string } | null = null;
      for (let i = 0; i < 3 && !created; i++) {
        try {
          created = await tx.inquiry.create({
            data: {
              inquiryNumber: generateInquiryNumber(),
              source: d.source,
              inquiryType: d.inquiryType,
              customerId: customer.id,
              contactPerson: d.contactPerson,
              companyName: d.companyName,
              email: d.email,
              phone: d.phone,
              country: d.country,
              message: d.message,
              deliveryAddress: d.deliveryAddress,
              assignedToId: staff.id,
              adminNotes: `Entered manually by ${staff.name ?? staff.email} (source: ${d.source.toLowerCase()}).`,
            },
            select: { id: true },
          });
        } catch (e) {
          if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"))
            throw e;
        }
      }
      if (!created) throw new Error("Could not allocate an inquiry number");
      if (d.product) {
        await tx.inquiryItem.create({
          data: {
            inquiryId: created.id,
            productName: d.product,
            productSku: d.productSku,
            requestedQuantity: d.requestedQuantity,
          },
        });
      }
      return created.id;
    });
    return { ok: true, message: "Inquiry recorded.", data: { id } };
  } catch (error) {
    return failure(error);
  }
}
