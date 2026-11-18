import { z } from "zod";

import { isValidAlibabaUrl } from "@/features/products/links";
import { COUNTRY_CODES } from "@/lib/data/countries";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use at most ${max} characters`)
    .optional()
    .transform((v) => (v ? v : null));
const money = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine(
    (v) => v === null || /^\d{1,10}(\.\d{1,2})?$/.test(v),
    "Use a number with up to 2 decimals",
  );
const int = (min: number, max: number) =>
  z
    .union([z.literal(""), z.coerce.number().int("Use a whole number").min(min).max(max)])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));
/** Comma/newline separated list → trimmed, de-duplicated array. */
const list = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => [
      ...new Set(
        (v ?? "")
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ])
    .refine((arr) => arr.length <= max, `At most ${max} entries`)
    .refine(
      (arr) => arr.every((s) => s.length <= 60),
      "Each entry must be at most 60 characters",
    );

/** Optional text that also accepts null (values coming back from the database). */
const ntext = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

export const imageSchema = z.object({
  imageUrl: z
    .string()
    .trim()
    .url()
    .refine(
      (u) => u.startsWith("https://res.cloudinary.com/"),
      "Images must be hosted on Cloudinary",
    ),
  publicId: ntext(300),
  altText: ntext(200),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Variant name is required").max(120),
  sku: text(64),
  color: text(60),
  size: text(60),
  material: text(80),
  isActive: z.boolean(),
});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(160),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only"),
    sku: text(64),
    categoryId: z.string().min(1, "Choose a category"),
    productType: text(60),
    shortDescription: text(300),
    description: text(10_000),
    material: text(200),
    materials: list(12),
    colors: list(20),
    dimensions: text(120),
    weight: text(60),
    originCountry: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => COUNTRY_CODES.has(v), "Choose a country"),
    originRegion: text(80),
    minimumOrderQuantity: int(1, 10_000_000),
    unit: z.string().trim().min(1).max(30),
    priceMin: money,
    priceMax: money,
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "3-letter currency code"),
    incoterm: z
      .enum(["EXW", "FOB", "CFR", "CIF", "DAP", "DDP", ""])
      .transform((v) => (v ? v : null)),
    leadTimeDays: int(1, 730),
    productionCapacity: text(120),
    packagingDetails: text(2000),
    hsCode: text(20),
    sampleAvailable: z.boolean(),
    isCustomizable: z.boolean(),
    customizationOptions: list(20),
    retailPrice: money,
    stockQuantity: int(0, 10_000_000),
    alibabaUrl: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : null))
      .refine(
        (v) => v === null || isValidAlibabaUrl(v),
        "Use an https:// link on alibaba.com",
      ),
    alibabaProductId: text(40),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    seoTitle: text(70),
    seoDescription: text(170),
    images: z.array(imageSchema).max(12, "At most 12 images"),
    variants: z.array(variantSchema).max(50, "At most 50 variants"),
  })
  .refine(
    (v) =>
      v.priceMin === null ||
      v.priceMax === null ||
      Number(v.priceMax) >= Number(v.priceMin),
    {
      path: ["priceMax"],
      message: "Maximum price must be at least the minimum price",
    },
  )
  .refine(
    (v) =>
      v.variants.filter((x) => x.sku).length ===
      new Set(v.variants.map((x) => x.sku).filter(Boolean)).size,
    {
      path: ["variants"],
      message: "Variant SKUs must be unique",
    },
  );

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;
