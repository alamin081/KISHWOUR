"use server";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { absoluteUrl } from "@/config/site";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { withTransaction } from "@/lib/db/transaction";
import { isEmailConfigured, sendEmail } from "@/lib/email";
import { getEmailBrand } from "@/lib/email/brand";
import {
  adminNewInquiryEmail,
  inquiryReceivedEmail,
  sampleRequestReceivedEmail,
} from "@/lib/email/templates";
import { getServerEnv } from "@/lib/env/server";

import { generateInquiryNumber } from "./inquiry-number";
import {
  type BuyerInquiry,
  type BuyerInquiryInput,
  type BuyerInquiryResult,
  buyerInquirySchema,
} from "./schema";

const LIMITS = {
  perIpPerHour: 5,
  perEmailPerDay: 10,
  duplicateWindowMin: 15,
  minFillMs: 3_000,
};

function hash(value: string): string {
  const salt = getServerEnv().AUTH_SECRET ?? "kishwour";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

/** Maps each public form onto the inquiry record. */
function toRecord(d: BuyerInquiry) {
  switch (d.kind) {
    case "quote":
      return {
        inquiryType: d.inquiryType,
        contactPerson: d.contactPerson,
        companyName: d.companyName,
        phone: d.phone,
        businessType: d.businessType,
        message: d.message,
        customizationRequirements: d.customizationRequirements,
        deliveryAddress: undefined,
        subject: undefined as string | undefined,
        item:
          d.product || d.productSlug
            ? {
                slug: d.productSlug,
                name: d.product,
                sku: d.productSku,
                quantity: d.requestedQuantity,
              }
            : null,
        quantity: d.requestedQuantity,
      };
    case "sample":
      return {
        inquiryType: "SAMPLE_REQUEST" as const,
        contactPerson: d.contactPerson ?? d.companyName,
        companyName: d.companyName,
        phone: undefined,
        businessType: undefined,
        message: d.requirements ?? `Sample request: ${d.quantity} × ${d.product}`,
        customizationRequirements: undefined,
        deliveryAddress: d.deliveryAddress,
        subject: undefined as string | undefined,
        item: {
          slug: d.productSlug,
          name: d.product,
          sku: undefined,
          quantity: d.quantity,
        },
        quantity: d.quantity,
      };
    case "contact":
      return {
        inquiryType: "GENERAL" as const,
        contactPerson: d.contactPerson,
        companyName: d.companyName,
        phone: d.phone,
        businessType: undefined,
        message: d.message,
        customizationRequirements: undefined,
        deliveryAddress: undefined,
        subject: d.subject,
        item: null,
        quantity: undefined,
      };
  }
}

/**
 * Public submission for Request a Quote, Request a Sample and Contact.
 * Validate → anti-spam → de-duplicate → rate-limit → save customer + inquiry (+ item)
 * → notify admin + acknowledge buyer (only if email is configured; recorded when sent).
 * Never reports success unless the inquiry is stored.
 */
export async function submitBuyerInquiry(
  input: BuyerInquiryInput,
): Promise<BuyerInquiryResult> {
  const parsed = buyerInquirySchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "");
      if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, message: "Please correct the highlighted fields.", fieldErrors };
  }
  const d = parsed.data;

  // Spam protection — honest rejections, never a fake success.
  if (d.website)
    return {
      ok: false,
      message:
        "Your submission could not be processed. Please contact us by email instead.",
    };
  if (d.elapsedMs !== undefined && d.elapsedMs < LIMITS.minFillMs) {
    return {
      ok: false,
      message: "That was very fast — please review your details and submit again.",
    };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
  const ipHash = hash(ip);
  const userAgent = h.get("user-agent")?.slice(0, 300) ?? null;
  const rec = toRecord(d);

  try {
    // Duplicate submission (double click / refresh): same key → same inquiry.
    const sameKey = await db.inquiry.findUnique({
      where: { submissionKey: d.submissionKey },
      select: { inquiryNumber: true },
    });
    if (sameKey)
      return { ok: true, inquiryNumber: sameKey.inquiryNumber, duplicate: true };

    const now = Date.now();
    const [byIp, byEmail, sameMessage] = await Promise.all([
      db.inquiry.count({
        where: { ipHash, createdAt: { gte: new Date(now - 3_600_000) } },
      }),
      db.inquiry.count({
        where: { email: d.email, createdAt: { gte: new Date(now - 86_400_000) } },
      }),
      db.inquiry.findFirst({
        where: {
          email: d.email,
          message: rec.message,
          createdAt: { gte: new Date(now - LIMITS.duplicateWindowMin * 60_000) },
        },
        select: { inquiryNumber: true },
      }),
    ]);
    // Same message from the same email moments ago → return the existing inquiry, don't duplicate.
    if (sameMessage)
      return { ok: true, inquiryNumber: sameMessage.inquiryNumber, duplicate: true };
    if (byIp >= LIMITS.perIpPerHour || byEmail >= LIMITS.perEmailPerDay) {
      return {
        ok: false,
        message:
          "You have sent several requests recently. Please try again later or email us directly.",
      };
    }

    const product = rec.item?.slug
      ? await db.product.findFirst({
          where: { slug: rec.item.slug, isActive: true },
          select: { id: true, name: true, sku: true },
        })
      : null;
    const itemName = product?.name ?? rec.item?.name;

    const created = await withTransaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { email: d.email },
        create: {
          email: d.email,
          companyName: rec.companyName,
          contactPerson: rec.contactPerson,
          phone: rec.phone,
          country: d.country,
          businessType: rec.businessType,
          address: rec.deliveryAddress,
        },
        update: {
          ...(rec.companyName ? { companyName: rec.companyName } : {}),
          contactPerson: rec.contactPerson,
          ...(rec.phone ? { phone: rec.phone } : {}),
          country: d.country,
          ...(rec.businessType ? { businessType: rec.businessType } : {}),
          ...(rec.deliveryAddress ? { address: rec.deliveryAddress } : {}),
        },
        select: { id: true },
      });

      let inquiry: { id: string; inquiryNumber: string } | null = null;
      for (let attempt = 0; attempt < 3 && !inquiry; attempt++) {
        try {
          inquiry = await tx.inquiry.create({
            data: {
              inquiryNumber: generateInquiryNumber(),
              inquiryType: rec.inquiryType,
              source: "WEBSITE",
              customerId: customer.id,
              contactPerson: rec.contactPerson,
              companyName: rec.companyName,
              email: d.email,
              phone: rec.phone,
              country: d.country,
              businessType: rec.businessType,
              subject:
                rec.subject ??
                (itemName
                  ? `${rec.inquiryType === "SAMPLE_REQUEST" ? "Sample request" : "Quotation request"}: ${itemName}`
                  : undefined),
              message: rec.message,
              customizationRequirements: rec.customizationRequirements,
              deliveryAddress: rec.deliveryAddress,
              submissionKey: d.submissionKey,
              ipHash,
              userAgent,
            },
            select: { id: true, inquiryNumber: true },
          });
        } catch (error) {
          if (!(
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ))
            throw error;
          const target = String(error.meta?.["target"] ?? "");
          if (target.includes("submissionKey")) {
            // A parallel request with the same key won the race.
            const existing = await tx.inquiry.findUnique({
              where: { submissionKey: d.submissionKey },
              select: { id: true, inquiryNumber: true },
            });
            if (existing) return { ...existing, duplicate: true };
          }
        }
      }
      if (!inquiry) throw new Error("Could not allocate an inquiry number");

      if (itemName) {
        await tx.inquiryItem.create({
          data: {
            inquiryId: inquiry.id,
            productId: product?.id ?? null,
            productName: itemName,
            productSku: product?.sku ?? rec.item?.sku ?? null,
            requestedQuantity: rec.item?.quantity ?? null,
          },
        });
      }
      return { ...inquiry, duplicate: false };
    });

    if (!created.duplicate) await notify(created.id, d, rec, itemName);
    return {
      ok: true,
      inquiryNumber: created.inquiryNumber,
      duplicate: created.duplicate,
    };
  } catch (error) {
    console.error("[inquiry] failed to store inquiry", error);
    return {
      ok: false,
      message:
        "We could not send your request right now. Please try again in a few minutes or email us directly.",
    };
  }
}

/** Sends admin + buyer emails when configured; records each successful send. Never throws. */
async function notify(
  inquiryId: string,
  d: BuyerInquiry,
  rec: ReturnType<typeof toRecord>,
  itemName: string | undefined,
) {
  if (!isEmailConfigured()) return;
  const env = getServerEnv();
  const inquiry = await db.inquiry.findUnique({
    where: { id: inquiryId },
    select: { inquiryNumber: true },
  });
  if (!inquiry) return;
  const brand = await getEmailBrand();
  const productLines = itemName
    ? [`${itemName}${rec.quantity ? ` — quantity ${rec.quantity}` : ""}`]
    : [];
  const summary = {
    inquiryNumber: inquiry.inquiryNumber,
    contactName: rec.contactPerson,
    productLines,
  };

  if (env.ADMIN_EMAIL) {
    try {
      const mail = adminNewInquiryEmail(brand, {
        ...summary,
        type: rec.inquiryType,
        company: rec.companyName ?? null,
        email: d.email,
        country: d.country,
        message: rec.message,
        adminUrl: absoluteUrl(`/admin/inquiries/${inquiryId}`),
      });
      await sendEmail({ to: env.ADMIN_EMAIL, replyTo: d.email, ...mail });
      await db.inquiry.update({
        where: { id: inquiryId },
        data: { adminNotifiedAt: new Date() },
      });
    } catch (error) {
      console.error("[inquiry] admin notification failed", inquiry.inquiryNumber, error);
    }
  }
  try {
    const mail =
      rec.inquiryType === "SAMPLE_REQUEST"
        ? sampleRequestReceivedEmail(brand, summary)
        : inquiryReceivedEmail(brand, summary);
    await sendEmail({ to: d.email, ...mail });
    await db.inquiry.update({
      where: { id: inquiryId },
      data: { buyerAckSentAt: new Date() },
    });
  } catch (error) {
    console.error("[inquiry] buyer acknowledgement failed", inquiry.inquiryNumber, error);
  }
}
