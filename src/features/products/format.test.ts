import { describe, expect, it } from "vitest";

import { countryName, formatLeadTime, formatPriceRange, formatQuantity } from "./format";

describe("formatPriceRange", () => {
  it("formats a range", () => {
    expect(formatPriceRange("4.5", "6", "USD")).toBe("$4.50 – $6.00");
  });
  it("collapses equal bounds", () => {
    expect(formatPriceRange("5.00", "5.00", "USD")).toBe("$5.00");
  });
  it("handles one-sided ranges", () => {
    expect(formatPriceRange("3.2", null, "USD")).toBe("From $3.20");
    expect(formatPriceRange(null, "9", "USD")).toBe("Up to $9.00");
  });
  it("returns null when no price is published", () => {
    expect(formatPriceRange(null, null, "USD")).toBeNull();
    expect(formatPriceRange("", "abc", "USD")).toBeNull();
  });
  it("uses the given currency", () => {
    expect(formatPriceRange("10", null, "EUR")).toBe("From €10.00");
  });
});

describe("formatQuantity / formatLeadTime", () => {
  it("formats MOQ with unit and thousands separators", () => {
    expect(formatQuantity(1200, "pairs")).toBe("1,200 pairs");
    expect(formatQuantity(null, "pieces")).toBeNull();
  });
  it("pluralises lead time", () => {
    expect(formatLeadTime(1)).toBe("1 day");
    expect(formatLeadTime(45)).toBe("45 days");
    expect(formatLeadTime(null)).toBeNull();
  });
});

describe("countryName", () => {
  it("maps ISO codes to names", () => {
    expect(countryName("BD")).toBe("Bangladesh");
    expect(countryName("de")).toBe("Germany");
  });
});
