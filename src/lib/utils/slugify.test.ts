import { describe, expect, it } from "vitest";

import { INITIAL_CATEGORIES } from "@/features/categories/constants";

import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Handmade Bags & Accessories")).toBe("handmade-bags-and-accessories");
  });

  it("strips diacritics", () => {
    expect(slugify("Handmade Home Décor")).toBe("handmade-home-decor");
  });

  it("trims leading/trailing separators", () => {
    expect(slugify("  --Footwear!!  ")).toBe("footwear");
  });

  it("launch category slugs are valid, unique URL slugs", () => {
    const slugs = INITIAL_CATEGORIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slugify(slug)).toBe(slug);
  });
});
