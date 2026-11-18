import { describe, expect, it } from "vitest";

import { currencySchema, emailSchema, phoneSchema, slugSchema } from "./common";

describe("common validation schemas", () => {
  it("accepts valid slugs and rejects invalid ones", () => {
    expect(slugSchema.safeParse("jute-products-and-bags").success).toBe(true);
    expect(slugSchema.safeParse("Jute Bags").success).toBe(false);
    expect(slugSchema.safeParse("double--hyphen").success).toBe(false);
  });

  it("normalises email addresses", () => {
    expect(emailSchema.parse("  Buyer@Example.COM ")).toBe("buyer@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("accepts international phone numbers", () => {
    expect(phoneSchema.safeParse("+880 1712-345678").success).toBe(true);
    expect(phoneSchema.safeParse("call me").success).toBe(false);
  });

  it("uppercases currency codes", () => {
    expect(currencySchema.parse("usd")).toBe("USD");
    expect(currencySchema.safeParse("US").success).toBe(false);
  });
});
