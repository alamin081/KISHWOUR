import { describe, expect, it } from "vitest";

import {
  defaultHomepageContent,
  emptyTestimonial,
  homepageContentSchema,
  type HomepageTestimonial,
  MAX_TESTIMONIALS,
  newTestimonialId,
  testimonialListSchema,
  testimonialSchema,
} from "./schema";
import { cloudinaryUrl, testimonialWithPhoto } from "./test-helpers";

const valid: HomepageTestimonial = {
  id: "t-1",
  quote: "The samples matched the specification exactly.",
  name: "A. Buyer",
  role: "Purchasing Manager",
  company: "Acme Import GmbH",
  country: "DE",
  photo: null,
};

const withItems = (items: HomepageTestimonial[]) => {
  const content = structuredClone(defaultHomepageContent);
  content.testimonials.items = items;
  return content;
};

describe("testimonialSchema", () => {
  it("accepts a complete testimonial", () => {
    expect(testimonialSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts one with only the required fields", () => {
    expect(
      testimonialSchema.safeParse({
        id: "t-2",
        quote: "Reliable communication throughout.",
        name: "B. Buyer",
        role: "",
        company: "",
        country: "",
        photo: null,
      }).success,
    ).toBe(true);
  });

  it("requires a quote and a name", () => {
    expect(testimonialSchema.safeParse({ ...valid, quote: "   " }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("enforces the field limits", () => {
    expect(
      testimonialSchema.safeParse({ ...valid, quote: "x".repeat(701) }).success,
    ).toBe(false);
    expect(testimonialSchema.safeParse({ ...valid, name: "x".repeat(81) }).success).toBe(
      false,
    );
    expect(testimonialSchema.safeParse({ ...valid, role: "x".repeat(81) }).success).toBe(
      false,
    );
    expect(
      testimonialSchema.safeParse({ ...valid, company: "x".repeat(81) }).success,
    ).toBe(false);
  });

  it("trims text and upper-cases the country code", () => {
    const parsed = testimonialSchema.parse({
      ...valid,
      name: "  A. Buyer  ",
      country: "de",
    });
    expect(parsed.name).toBe("A. Buyer");
    expect(parsed.country).toBe("DE");
  });

  it("only accepts a real ISO country code, or none", () => {
    expect(testimonialSchema.safeParse({ ...valid, country: "BD" }).success).toBe(true);
    expect(testimonialSchema.safeParse({ ...valid, country: "" }).success).toBe(true);
    expect(testimonialSchema.safeParse({ ...valid, country: "XX" }).success).toBe(false);
    expect(testimonialSchema.safeParse({ ...valid, country: "GERMANY" }).success).toBe(
      false,
    );
  });

  it("requires a Cloudinary URL and alt text for a photo", () => {
    expect(
      testimonialSchema.safeParse(testimonialWithPhoto("kishwour/site/p")).success,
    ).toBe(true);
    expect(
      testimonialSchema.safeParse({
        ...valid,
        photo: { url: "https://evil.example/face.jpg", alt: "Portrait", publicId: "" },
      }).success,
    ).toBe(false);
    expect(
      testimonialSchema.safeParse({
        ...valid,
        photo: { url: cloudinaryUrl("kishwour/site/p"), alt: "  ", publicId: "" },
      }).success,
    ).toBe(false);
  });

  it("needs an ID", () => {
    expect(testimonialSchema.safeParse({ ...valid, id: "" }).success).toBe(false);
  });
});

describe("testimonialListSchema", () => {
  it("accepts an empty list - the section then stays hidden", () => {
    expect(testimonialListSchema.safeParse([]).success).toBe(true);
    expect(defaultHomepageContent.testimonials.items).toEqual([]);
  });

  it(`accepts up to ${MAX_TESTIMONIALS} and rejects more`, () => {
    const make = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ ...valid, id: `t-${i}` }));
    expect(testimonialListSchema.safeParse(make(MAX_TESTIMONIALS)).success).toBe(true);
    expect(testimonialListSchema.safeParse(make(MAX_TESTIMONIALS + 1)).success).toBe(
      false,
    );
  });

  it("rejects duplicate IDs and points at the offender", () => {
    const parsed = testimonialListSchema.safeParse([valid, { ...valid }]);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual([1, "id"]);
  });
});

describe("the testimonials section inside the document", () => {
  it("validates its items and reports the full field path", () => {
    const parsed = homepageContentSchema.safeParse(withItems([{ ...valid, quote: "" }]));
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(["testimonials", "items", 0, "quote"]);
  });

  it("round-trips a list with a photo", () => {
    const content = withItems([valid, testimonialWithPhoto("kishwour/site/buyer")]);
    const parsed = homepageContentSchema.safeParse(content);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.testimonials.items[1]?.photo?.publicId).toBe(
      "kishwour/site/buyer",
    );
  });
});

describe("new testimonial rows", () => {
  it("are completely empty - nothing is ever pre-filled", () => {
    const fresh = emptyTestimonial();
    expect(fresh).toMatchObject({
      quote: "",
      name: "",
      role: "",
      company: "",
      country: "",
      photo: null,
    });
    expect(fresh.id).not.toBe("");
    // Empty on purpose, so it cannot be saved until a real quote is entered.
    expect(testimonialSchema.safeParse(fresh).success).toBe(false);
  });

  it("get unique IDs", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newTestimonialId()));
    expect(ids.size).toBe(50);
  });
});
