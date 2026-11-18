import { describe, expect, it } from "vitest";

import { computeTotals, fromCents, quotationFormSchema, toCents } from "./schema";

describe("money helpers", () => {
  it("converts without floating point errors", () => {
    expect(toCents("0.1")).toBe(10);
    expect(toCents("4.55")).toBe(455);
    expect(toCents("12")).toBe(1200);
    expect(fromCents(455)).toBe("4.55");
    expect(fromCents(1200)).toBe("12.00");
    expect(fromCents(5)).toBe("0.05");
  });

  it("computes line totals, subtotal and total", () => {
    const t = computeTotals(
      [
        { quantity: 3, unitPrice: "0.10" },
        { quantity: 500, unitPrice: "4.55" },
      ],
      "120.5",
    );
    expect(t.lines).toEqual([30, 227500]);
    expect(t.subtotal).toBe(227530);
    expect(fromCents(t.total)).toBe("2395.80");
  });
});

describe("quotationFormSchema", () => {
  const base = {
    inquiryId: "i1",
    status: "DRAFT",
    currency: "usd",
    incoterm: "FOB",
    shippingCost: "",
    items: [
      {
        description: "Jute tote",
        quantity: "500",
        unit: "pieces",
        unitPrice: "4.5",
        moq: "",
      },
    ],
  } as const;
  it("normalises input", () => {
    const v = quotationFormSchema.parse(base);
    expect(v.currency).toBe("USD");
    expect(v.shippingCost).toBe("0");
    expect(v.items[0]?.quantity).toBe(500);
    expect(v.items[0]?.moq).toBeNull();
  });
  it("rejects bad prices and empty quotations", () => {
    expect(
      quotationFormSchema.safeParse({
        ...base,
        items: [{ ...base.items[0], unitPrice: "4.555" }],
      }).success,
    ).toBe(false);
    expect(quotationFormSchema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(
      quotationFormSchema.safeParse({ ...base, validityDate: "31/12/2026" }).success,
    ).toBe(false);
  });
});
