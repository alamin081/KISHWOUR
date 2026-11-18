/**
 * Database model and enum types for use across the app.
 * Type-only re-exports: safe to import from client components (no runtime code).
 */
export type {
  Category,
  Inquiry,
  InquiryItem,
  Product,
  ProductImage,
  Quotation,
  QuotationItem,
  User,
} from "@/generated/prisma/client";

export type {
  Incoterm,
  InquirySource,
  InquiryStatus,
  InquiryType,
  QuotationStatus,
  Role,
} from "@/generated/prisma/enums";
