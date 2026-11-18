import { describe, expect, it } from "vitest";

import { categoryFormSchema, wouldCreateCycle } from "./schema";

describe("wouldCreateCycle", () => {
  const parents = new Map<string, string | null>([
    ["root", null],
    ["child", "root"],
    ["grandchild", "child"],
  ]);
  it("detects self and descendant parents", () => {
    expect(wouldCreateCycle("root", "root", parents)).toBe(true);
    expect(wouldCreateCycle("root", "grandchild", parents)).toBe(true);
  });
  it("allows valid parents", () => {
    expect(wouldCreateCycle("grandchild", "root", parents)).toBe(false);
    expect(wouldCreateCycle("child", null, parents)).toBe(false);
  });
});

describe("categoryFormSchema", () => {
  it("normalises and validates", () => {
    const v = categoryFormSchema.parse({
      name: "Footwear",
      slug: "Footwear",
      sortOrder: "2",
      isActive: true,
      description: "",
    });
    expect(v.slug).toBe("footwear");
    expect(v.description).toBeNull();
    expect(
      categoryFormSchema.safeParse({
        name: "X y",
        slug: "bad slug",
        sortOrder: 0,
        isActive: true,
      }).success,
    ).toBe(false);
    expect(
      categoryFormSchema.safeParse({
        name: "Shoes",
        slug: "shoes",
        sortOrder: 0,
        isActive: true,
        image: "https://evil.example/a.jpg",
      }).success,
    ).toBe(false);
  });
});
