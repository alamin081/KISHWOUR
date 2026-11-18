/** Pure display helpers for product data. Safe on server and client. */

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter;
}

function toAmount(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Wholesale price range, e.g. "$4.50 – $6.00".
 * Returns null when no price is published (prices are then given on quotation).
 */
export function formatPriceRange(
  min: string | null,
  max: string | null,
  currency: string,
): string | null {
  const lo = toAmount(min);
  const hi = toAmount(max);
  const fmt = currencyFormatter(currency);

  if (lo !== null && hi !== null) {
    return lo === hi ? fmt.format(lo) : `${fmt.format(lo)} – ${fmt.format(hi)}`;
  }
  if (lo !== null) return `From ${fmt.format(lo)}`;
  if (hi !== null) return `Up to ${fmt.format(hi)}`;
  return null;
}

/** Minimum order quantity, e.g. "500 pieces". */
export function formatQuantity(quantity: number | null, unit: string): string | null {
  if (quantity === null) return null;
  return `${quantity.toLocaleString("en-US")} ${unit}`;
}

/** Production lead time, e.g. "30 days" / "1 day". */
export function formatLeadTime(days: number | null): string | null {
  if (days === null) return null;
  return `${days.toLocaleString("en-US")} ${days === 1 ? "day" : "days"}`;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

/** ISO 3166-1 alpha-2 → English country name ("BD" → "Bangladesh"). */
export function countryName(code: string): string {
  try {
    return regionNames.of(code.trim().toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
