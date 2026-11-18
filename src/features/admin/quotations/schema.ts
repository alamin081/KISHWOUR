import { z } from "zod";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));
const money = z
  .string()
  .trim()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, "Use a number with up to 2 decimals");

export const quotationItemSchema = z.object({
  productId: text(40),
  description: z.string().trim().min(1, "Description is required").max(300),
  quantity: z.coerce.number().int("Whole number").min(1, "At least 1").max(10_000_000),
  moq: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(10_000_000)])
    .nullish()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  unit: z.string().trim().min(1).max(30),
  unitPrice: money,
});

export const quotationFormSchema = z.object({
  inquiryId: z.string().min(1),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "3-letter currency code"),
  incoterm: z
    .enum(["EXW", "FOB", "CFR", "CIF", "DAP", "DDP", ""])
    .transform((v) => (v ? v : null)),
  shippingTerms: text(300),
  paymentTerms: text(300),
  leadTime: text(120),
  validityDate: z
    .string()
    .trim()
    .nullish()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use a valid date"),
  shippingCost: money.or(z.literal("").transform(() => "0")),
  notes: text(5000),
  items: z.array(quotationItemSchema).min(1, "Add at least one line").max(100),
});

export type QuotationFormInput = z.input<typeof quotationFormSchema>;
export type QuotationFormValues = z.output<typeof quotationFormSchema>;

/** "12.5" → 1250 (integer cents; avoids floating-point rounding). */
export function toCents(value: string): number {
  const [whole = "0", frac = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

export function fromCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Line totals, subtotal and total in cents. */
export function computeTotals(
  items: { quantity: number; unitPrice: string }[],
  shippingCost: string,
) {
  const lines = items.map((i) => i.quantity * toCents(i.unitPrice));
  const subtotal = lines.reduce((a, b) => a + b, 0);
  const total = subtotal + toCents(shippingCost || "0");
  return { lines, subtotal, total };
}
