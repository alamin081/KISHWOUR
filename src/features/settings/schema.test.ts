import { describe, expect, it } from "vitest";

import { defaultSettings, paragraphs, settingSchemas } from "./schema";

describe("settings schemas", () => {
  it("accept the defaults", () => {
    for (const key of Object.keys(settingSchemas) as (keyof typeof settingSchemas)[]) {
      expect(settingSchemas[key].safeParse(defaultSettings[key]).success, key).toBe(true);
    }
  });

  it("validates contact details", () => {
    expect(
      settingSchemas.contact.safeParse({
        email: "Sales@Kishwour.com",
        whatsapp: "8801712345678",
      }).success,
    ).toBe(true);
    expect(settingSchemas.contact.parse({ email: "Sales@Kishwour.com" }).email).toBe(
      "sales@kishwour.com",
    );
    expect(settingSchemas.contact.safeParse({ whatsapp: "+880 1712" }).success).toBe(
      false,
    );
    expect(settingSchemas.contact.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("only accepts https social links and alibaba store URLs", () => {
    expect(
      settingSchemas.social.safeParse({ facebook: "http://facebook.com/x" }).success,
    ).toBe(false);
    expect(
      settingSchemas.alibaba.safeParse({ storeUrl: "https://kishwour.en.alibaba.com/" })
        .success,
    ).toBe(true);
    expect(
      settingSchemas.alibaba.safeParse({ storeUrl: "https://example.com" }).success,
    ).toBe(false);
  });

  it("requires core brand and home text", () => {
    expect(
      settingSchemas.brand.safeParse({ tagline: "", description: "x" }).success,
    ).toBe(false);
    expect(
      settingSchemas.home.safeParse({ ...defaultSettings.home, heroTitle: " " }).success,
    ).toBe(false);
  });

  it("splits paragraphs on blank lines", () => {
    expect(paragraphs("One.\n\nTwo\nlines.\n\n\n Three. ")).toEqual([
      "One.",
      "Two\nlines.",
      "Three.",
    ]);
  });
});
