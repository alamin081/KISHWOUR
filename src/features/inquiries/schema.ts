import { z } from "zod";

import { COUNTRY_CODES } from "@/lib/data/countries";
import { emailSchema } from "@/lib/validations/common";

export const BUSINESS_TYPES = [
  "Importer",
  "Wholesaler",
  "Distributor",
  "Retailer",
  "Brand owner",
  "E-commerce seller",
  "Interior / hospitality",
  "Other",
] as const;

export const QUOTE_TYPES = [
  { value: "WHOLESALE", label: "Wholesale / bulk order" },
  { value: "OEM_ODM", label: "Custom manufacturing / private label (OEM / ODM)" },
] as const;

const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use at most ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));
const country = z
  .string()
  .trim()
  .toUpperCase()
  .refine((v) => COUNTRY_CODES.has(v), "Choose your country");
const phone = z
  .string()
  .trim()
  .max(30)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine(
    (v) => v === undefined || /^\+?[0-9\s\-()]{6,30}$/.test(v),
    "Enter a valid phone number",
  );
const quantity = (max: number, label = "Enter a quantity") =>
  z.coerce
    .number({ error: label })
    .int("Use a whole number")
    .min(1, label)
    .max(max, `At most ${max.toLocaleString("en-US")}`);
const productSlug = z
  .string()
  .trim()
  .max(120)
  .regex(/^[a-z0-9-]*$/)
  .optional()
  .transform((v) => (v ? v : undefined));

/** Anti-spam / anti-duplicate fields present on every public form. */
const guard = {
  /** Random key generated when the form is shown; repeats of the same key never create a second inquiry. */
  submissionKey: z
    .string()
    .regex(/^[A-Za-z0-9_-]{16,64}$/, "Please reload the page and try again"),
  /** Honeypot — must stay empty. */
  website: z.string().max(500).optional(),
  /** Milliseconds between first interaction and submit. */
  elapsedMs: z.coerce.number().optional(),
};

export const quoteSchema = z.object({
  kind: z.literal("quote"),
  inquiryType: z.enum(["WHOLESALE", "OEM_ODM"]),
  companyName: z.string().trim().min(2, "Enter your company name").max(160),
  contactPerson: z.string().trim().min(2, "Enter your name").max(120),
  email: emailSchema,
  phone,
  country,
  businessType: z.enum(BUSINESS_TYPES, { error: "Choose your business type" }),
  productSlug,
  product: opt(160),
  productSku: opt(64),
  requestedQuantity: quantity(10_000_000, "Enter the quantity you need"),
  customizationRequirements: opt(3000),
  message: z
    .string()
    .trim()
    .min(20, "Please describe your request (at least 20 characters)")
    .max(5000),
  ...guard,
});

export const sampleSchema = z.object({
  kind: z.literal("sample"),
  companyName: z.string().trim().min(2, "Enter your company name").max(160),
  contactPerson: opt(120),
  email: emailSchema,
  country,
  productSlug,
  product: z.string().trim().min(2, "Which product do you want a sample of?").max(160),
  quantity: quantity(100, "Enter the number of samples"),
  deliveryAddress: z.string().trim().min(10, "Enter the full delivery address").max(1000),
  requirements: opt(3000),
  ...guard,
});

export const contactSchema = z.object({
  kind: z.literal("contact"),
  contactPerson: z.string().trim().min(2, "Enter your name").max(120),
  companyName: opt(160),
  email: emailSchema,
  phone,
  country,
  subject: opt(160),
  message: z.string().trim().min(20, "Please write at least 20 characters").max(5000),
  ...guard,
});

export const buyerInquirySchema = z.discriminatedUnion("kind", [
  quoteSchema,
  sampleSchema,
  contactSchema,
]);

export type QuoteInput = z.input<typeof quoteSchema>;
export type SampleInput = z.input<typeof sampleSchema>;
export type ContactInput = z.input<typeof contactSchema>;
export type BuyerInquiryInput = z.input<typeof buyerInquirySchema>;
export type BuyerInquiry = z.output<typeof buyerInquirySchema>;

export type BuyerInquiryResult =
  | { ok: true; inquiryNumber: string; duplicate: boolean }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };
