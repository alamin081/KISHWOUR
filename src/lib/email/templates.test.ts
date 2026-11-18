import { describe, expect, it } from "vitest";

import {
  adminNewInquiryEmail,
  inquiryReceivedEmail,
  inquiryStatusEmail,
  quotationEmail,
  sampleRequestReceivedEmail,
} from "./templates";

const brand = {
  siteUrl: "https://example.com/",
  logoUrl: "https://example.com/logo.png",
  whatsappUrl: "https://wa.me/8801700000000",
  contactEmail: "sales@example.com",
};

describe("email templates", () => {
  it("escapes user-supplied values", () => {
    const e = inquiryReceivedEmail(brand, {
      inquiryNumber: "KSW-INQ-1",
      contactName: '<script>alert("x")</script>',
      productLines: ["Tote <b>bag</b>"],
    });
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.html).toContain("Tote &lt;b&gt;bag&lt;/b&gt;");
    expect(e.text).toContain("KSW-INQ-1");
  });

  it("includes the reference and branding in every buyer email", () => {
    for (const e of [
      inquiryReceivedEmail(brand, {
        inquiryNumber: "KSW-INQ-1",
        contactName: "Anna",
        productLines: [],
      }),
      sampleRequestReceivedEmail(brand, {
        inquiryNumber: "KSW-INQ-2",
        contactName: "Anna",
        productLines: ["Basket"],
      }),
      inquiryStatusEmail(brand, {
        inquiryNumber: "KSW-INQ-3",
        contactName: "Anna",
        status: "CONTACTED",
      }),
    ]) {
      expect(e.subject).toMatch(/KSW-INQ-\d/);
      expect(e.html).toContain("https://example.com/logo.png");
      expect(e.html).toContain("Made in Bangladesh");
      expect(e.text.length).toBeGreaterThan(20);
    }
  });

  it("distinguishes sent and updated quotations", () => {
    const sent = quotationEmail(brand, {
      contactName: "Anna",
      inquiryNumber: "I",
      quotationNumber: "Q",
      total: "USD 10.00",
      validUntil: null,
      updated: false,
    });
    const updated = quotationEmail(brand, {
      contactName: "Anna",
      inquiryNumber: "I",
      quotationNumber: "Q",
      total: "USD 10.00",
      validUntil: "1 Jan 2027",
      updated: true,
    });
    expect(sent.subject).toMatch(/^Your quotation/);
    expect(updated.subject).toMatch(/^Updated quotation/);
    expect(updated.html).toContain("replaces the previous version");
  });

  it("uses human status labels", () => {
    expect(
      inquiryStatusEmail(brand, {
        inquiryNumber: "I",
        contactName: "A",
        status: "QUOTATION_SENT",
      }).subject,
    ).toContain("Quotation sent");
  });

  it("builds an admin notification with a link to the admin", () => {
    const e = adminNewInquiryEmail(brand, {
      inquiryNumber: "I-1",
      contactName: "Anna",
      productLines: [],
      type: "SAMPLE_REQUEST",
      company: "ACME",
      email: "a@acme.com",
      country: "DE",
      message: "Hello",
      adminUrl: "https://example.com/admin/inquiries/x",
    });
    expect(e.subject).toContain("sample request");
    expect(e.html).toContain("https://example.com/admin/inquiries/x");
  });
});
