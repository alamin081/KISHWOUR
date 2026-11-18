import type { Incoterm } from "@/lib/db/types";

/**
 * Plain, serialisable shapes passed from data functions to components.
 * Prisma Decimal values are converted to strings so they can cross the
 * server → client boundary and be stored by `"use cache"`.
 */

export type ImageData = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};

export type CategoryRef = { name: string; slug: string };

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  category: CategoryRef;
  material: string | null;
  image: ImageData | null;
  minimumOrderQuantity: number | null;
  unit: string;
  priceMin: string | null;
  priceMax: string | null;
  currency: string;
  incoterm: Incoterm | null;
  isCustomizable: boolean;
  isFeatured: boolean;
};

export type VariantData = {
  id: string;
  name: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
};

export type ProductDetailData = ProductCardData & {
  categoryId: string;
  productType: string | null;
  materials: string[];
  variants: VariantData[];
  sku: string | null;
  description: string | null;
  images: ImageData[];
  originCountry: string;
  originRegion: string | null;
  colors: string[];
  dimensions: string | null;
  weight: string | null;
  leadTimeDays: number | null;
  productionCapacity: string | null;
  packagingDetails: string | null;
  hsCode: string | null;
  sampleAvailable: boolean;
  customizationOptions: string[];
  alibabaUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type ProductListResult = {
  items: ProductCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type FacetOption = { value: string; count: number };

export type CatalogFacets = { productTypes: FacetOption[]; materials: FacetOption[] };

/** Flat product row for the PDF catalogue. */
export type PdfProduct = {
  name: string;
  sku: string | null;
  slug: string;
  material: string | null;
  dimensions: string | null;
  weight: string | null;
  minimumOrderQuantity: number | null;
  unit: string;
  leadTimeDays: number | null;
  priceMin: string | null;
  priceMax: string | null;
  currency: string;
  incoterm: string | null;
  originCountry: string;
  imageUrl: string | null;
  category: { name: string; slug: string };
};
