import { describe, expect, it } from "vitest";

import { productFormSchema, type ProductFormInput } from "./schema";

const base: ProductFormInput = {
  name: "Jute Tote",
  slug: "jute-tote",
  categoryId: "c1",
  originCountry: "bd",
  unit: "pieces",
  currency: "usd",
  incoterm: "FOB",
  sampleAvailable: false,
  isCustomizable: true,
  isActive: false,
  isFeatured: false,
  images: [],
  variants: [],
};

describe("productFormSchema", () => {
  it("normalises lists, codes and empty values", () => {
    const v = productFormSchema.parse({
      ...base,
      materials: "Jute, Cotton,jute ,Jute",
      colors: "",
      priceMin: "4.5",
      minimumOrderQuantity: "500",
      sku: "",
    });
    expect(v.materials).toEqual(["Jute", "Cotton", "jute"]);
    expect(v.colors).toEqual([]);
    expect(v.originCountry).toBe("BD");
    expect(v.currency).toBe("USD");
    expect(v.minimumOrderQuantity).toBe(500);
    expect(v.sku).toBeNull();
  });

  it("validates price range, slug, alibaba URL and image host", () => {
    expect(
      productFormSchema.safeParse({ ...base, priceMin: "10", priceMax: "5" }).success,
    ).toBe(false);
    expect(productFormSchema.safeParse({ ...base, slug: "Bad Slug" }).success).toBe(
      false,
    );
    expect(
      productFormSchema.safeParse({ ...base, alibabaUrl: "https://evil.example" })
        .success,
    ).toBe(false);
    expect(
      productFormSchema.safeParse({
        ...base,
        images: [{ imageUrl: "https://evil.example/x.jpg" }],
      }).success,
    ).toBe(false);
    expect(productFormSchema.safeParse({ ...base, priceMin: "1.234" }).success).toBe(
      false,
    );
  });

  it("rejects duplicate variant SKUs", () => {
    const variants = [
      { name: "A", sku: "X1", isActive: true },
      { name: "B", sku: "X1", isActive: true },
    ];
    expect(productFormSchema.safeParse({ ...base, variants }).success).toBe(false);
  });
});
