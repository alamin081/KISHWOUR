import {
  countryName,
  formatLeadTime,
  formatPriceRange,
  formatQuantity,
} from "@/features/products/format";
import { type ProductDetailData } from "@/features/products/types";

/** Specification table; rows without data are omitted. */
export function ProductSpecs({ product }: { product: ProductDetailData }) {
  const price = formatPriceRange(product.priceMin, product.priceMax, product.currency);
  const origin = [product.originRegion, countryName(product.originCountry)]
    .filter(Boolean)
    .join(", ");

  const rows: [string, string | null][] = [
    ["Product type", product.productType],
    [
      "Material",
      product.material ??
        (product.materials.length ? product.materials.join(", ") : null),
    ],
    ["Colours", product.colors.length ? product.colors.join(", ") : null],
    ["Dimensions", product.dimensions],
    ["Weight", product.weight],
    ["Minimum order", formatQuantity(product.minimumOrderQuantity, product.unit)],
    [
      "Wholesale price",
      price ? `${price}${product.incoterm ? ` (${product.incoterm})` : ""}` : null,
    ],
    ["Lead time", formatLeadTime(product.leadTimeDays)],
    ["Production capacity", product.productionCapacity],
    ["Origin", origin],
    ["HS code", product.hsCode],
    ["SKU", product.sku],
    ["Samples", product.sampleAvailable ? "Available on request" : null],
    ["Customisation", product.isCustomizable ? "Available" : null],
  ];
  const visible = rows.filter((r): r is [string, string] => Boolean(r[1]));

  return (
    <dl className="divide-y divide-border border-y text-sm">
      {visible.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[9rem_1fr] gap-4 py-3">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
