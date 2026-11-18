import { describe, expect, it } from "vitest";

import {
  buildProductOrderBy,
  buildProductWhere,
  publicProductWhere,
} from "./catalog-query";
import { isValidAlibabaUrl, whatsAppLink } from "./links";
import { catalogHref, parseProductListParams } from "./schemas";

describe("parseProductListParams", () => {
  it("parses all filters", () => {
    expect(
      parseProductListParams({
        page: "2",
        q: " tote ",
        category: "jute-products",
        type: "Tote bag",
        material: "Jute",
        featured: "1",
        sort: "name-asc",
      }),
    ).toEqual({
      page: 2,
      q: "tote",
      category: "jute-products",
      type: "Tote bag",
      material: "Jute",
      featured: true,
      sort: "name-asc",
    });
  });

  it("falls back to safe defaults", () => {
    expect(
      parseProductListParams({
        page: "-1",
        sort: "price; DROP",
        category: "Bad Slug",
        featured: "yes",
      }),
    ).toEqual({
      page: 1,
      q: undefined,
      category: undefined,
      type: undefined,
      material: undefined,
      featured: false,
      sort: "featured",
    });
    expect(parseProductListParams({ q: "x".repeat(101) }).q).toBeUndefined();
    expect(parseProductListParams({ page: ["3", "9"] }).page).toBe(3);
  });
});

describe("buildProductWhere", () => {
  it("returns only the public constraint without filters", () => {
    expect(buildProductWhere({ featured: false })).toEqual(publicProductWhere);
  });

  it("combines filters with AND and searches name, SKU, variants and category", () => {
    const where = buildProductWhere({
      category: "footwear",
      type: "Sandal",
      material: "Leather",
      featured: true,
      q: "KSW-1",
    });
    expect(where.isActive).toBe(true);
    const and = where.AND as unknown[];
    expect(and).toHaveLength(5);
    expect(and).toContainEqual({ category: { slug: "footwear", isActive: true } });
    expect(and).toContainEqual({ materials: { has: "Leather" } });
    expect(and).toContainEqual({ isFeatured: true });
    const search = and.find((c) => typeof c === "object" && c !== null && "OR" in c) as {
      OR: Record<string, unknown>[];
    };
    const fields = search.OR.flatMap((o) => Object.keys(o));
    expect(fields).toEqual(
      expect.arrayContaining([
        "name",
        "sku",
        "variants",
        "category",
        "material",
        "productType",
      ]),
    );
  });
});

describe("buildProductOrderBy", () => {
  it("always ends with a unique tie-breaker", () => {
    for (const sort of [
      "featured",
      "newest",
      "name-asc",
      "name-desc",
      "moq-asc",
    ] as const) {
      const order = buildProductOrderBy(sort);
      expect(order.at(-1)).toEqual({ id: "asc" });
    }
  });
  it("puts products without MOQ last", () => {
    expect(buildProductOrderBy("moq-asc")[0]).toEqual({
      minimumOrderQuantity: { sort: "asc", nulls: "last" },
    });
  });
});

describe("catalogHref", () => {
  const current = {
    q: "bag",
    category: "jute-products",
    sort: "newest" as const,
    page: 3,
    featured: false,
  };
  it("keeps params, drops defaults and resets page on filter change", () => {
    expect(catalogHref("/products", current, { material: "Jute" })).toBe(
      "/products?q=bag&category=jute-products&material=Jute&sort=newest",
    );
  });
  it("keeps an explicit page and removes cleared params", () => {
    expect(catalogHref("/products", current, { page: 4, q: undefined })).toBe(
      "/products?category=jute-products&sort=newest&page=4",
    );
    expect(catalogHref("/products/footwear", {}, { sort: "featured" })).toBe(
      "/products/footwear",
    );
  });
});

describe("links", () => {
  it("accepts only https alibaba.com URLs", () => {
    expect(isValidAlibabaUrl("https://www.alibaba.com/product-detail/x_123.html")).toBe(
      true,
    );
    expect(isValidAlibabaUrl("https://kishwour.en.alibaba.com/")).toBe(true);
    expect(isValidAlibabaUrl("http://www.alibaba.com/x")).toBe(false);
    expect(isValidAlibabaUrl("https://alibaba.com.evil.example/x")).toBe(false);
    expect(isValidAlibabaUrl("https://notalibaba.com/x")).toBe(false);
    expect(isValidAlibabaUrl("javascript:alert(1)")).toBe(false);
    expect(isValidAlibabaUrl(null)).toBe(false);
  });
  it("builds wa.me links with an encoded message", () => {
    expect(whatsAppLink("+880 1712-345678", "Hi & hello")).toBe(
      "https://wa.me/8801712345678?text=Hi%20%26%20hello",
    );
    expect(whatsAppLink("123", "x")).toBeNull();
  });
});
