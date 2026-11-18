import { describe, expect, it } from "vitest";

import { generateInquiryNumber } from "./inquiry-number";
import { buyerInquirySchema } from "./schema";

const key = "abcdefghijklmnop1234";

describe("quote form", () => {
  const quote = {
    kind: "quote",
    inquiryType: "WHOLESALE",
    companyName: "ACME Imports GmbH",
    contactPerson: "Anna Buyer",
    email: "Anna@ACME.example",
    country: "de",
    businessType: "Importer",
    product: "Jute tote bag",
    productSku: "KSW-JT-01",
    requestedQuantity: "500",
    message: "We need 500 jute totes with our logo for our German stores.",
    submissionKey: key,
  } as const;

  it("accepts and normalises a valid quote request", () => {
    const v = buyerInquirySchema.parse(quote);
    expect(v.kind).toBe("quote");
    if (v.kind !== "quote") return;
    expect(v.email).toBe("anna@acme.example");
    expect(v.country).toBe("DE");
    expect(v.requestedQuantity).toBe(500);
  });

  it("requires company, business type, quantity and a real message", () => {
    expect(buyerInquirySchema.safeParse({ ...quote, companyName: "" }).success).toBe(
      false,
    );
    expect(
      buyerInquirySchema.safeParse({ ...quote, businessType: "Spammer" }).success,
    ).toBe(false);
    expect(
      buyerInquirySchema.safeParse({ ...quote, requestedQuantity: "0" }).success,
    ).toBe(false);
    expect(buyerInquirySchema.safeParse({ ...quote, message: "hi" }).success).toBe(false);
  });

  it("requires a valid submission key", () => {
    expect(
      buyerInquirySchema.safeParse({ ...quote, submissionKey: "short" }).success,
    ).toBe(false);
    expect(
      buyerInquirySchema.safeParse({ ...quote, submissionKey: "has spaces in it 12345" })
        .success,
    ).toBe(false);
  });
});

describe("sample form", () => {
  const sample = {
    kind: "sample",
    companyName: "ACME",
    email: "a@acme.example",
    country: "FR",
    product: "Woven basket",
    quantity: "2",
    deliveryAddress: "12 Rue Example, 75001 Paris, France",
    submissionKey: key,
  } as const;
  it("accepts a valid sample request", () => {
    expect(buyerInquirySchema.safeParse(sample).success).toBe(true);
  });
  it("limits sample quantity and requires a full address", () => {
    expect(buyerInquirySchema.safeParse({ ...sample, quantity: "500" }).success).toBe(
      false,
    );
    expect(
      buyerInquirySchema.safeParse({ ...sample, deliveryAddress: "Paris" }).success,
    ).toBe(false);
  });
});

describe("contact form", () => {
  it("accepts a minimal contact message", () => {
    expect(
      buyerInquirySchema.safeParse({
        kind: "contact",
        contactPerson: "Anna",
        email: "a@b.example",
        country: "US",
        message: "Do you ship to the United States?",
        submissionKey: key,
      }).success,
    ).toBe(true);
  });
  it("rejects unknown kinds", () => {
    expect(
      buyerInquirySchema.safeParse({ kind: "other", submissionKey: key }).success,
    ).toBe(false);
  });
});

describe("generateInquiryNumber", () => {
  it("has the expected format", () => {
    expect(generateInquiryNumber(new Date("2026-11-12T10:00:00Z"))).toMatch(
      /^KSW-INQ-20261112-[2-9A-HJ-NP-Z]{6}$/,
    );
  });
});
