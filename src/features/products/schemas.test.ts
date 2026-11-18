import { describe, expect, it } from "vitest";

import { parseProductListParams } from "./schemas";

describe("parseProductListParams", () => {
  it("parses valid params", () => {
    expect(
      parseProductListParams({ page: "3", q: " jute bag ", category: "footwear" }),
    ).toMatchObject({
      page: 3,
      q: "jute bag",
      category: "footwear",
    });
  });

  it("falls back to defaults for invalid input", () => {
    expect(
      parseProductListParams({ page: "-2", q: "", category: "Bad Slug!" }),
    ).toMatchObject({
      page: 1,
      q: undefined,
      category: undefined,
    });
    expect(parseProductListParams({ page: "abc" }).page).toBe(1);
    expect(parseProductListParams({ page: "999999" }).page).toBe(1);
  });

  it("uses the first value of repeated params", () => {
    expect(parseProductListParams({ page: ["2", "5"] }).page).toBe(2);
  });

  it("rejects overly long search terms", () => {
    expect(parseProductListParams({ q: "x".repeat(101) }).q).toBeUndefined();
  });
});
