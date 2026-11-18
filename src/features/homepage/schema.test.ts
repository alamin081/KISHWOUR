import { describe, expect, it } from "vitest";

import { homeContent } from "@/content/site-content";

import {
  applySectionValues,
  contentParagraphs,
  defaultHomepageContent,
  homepageContentSchema,
  homepageDefaultsFrom,
  homepageImageSchema,
  homepageSectionFormSchemas,
  MAX_CRAFT_POINTS,
  moveSection,
  normalizeSectionOrder,
  orderedSectionIds,
  parseHomepageContent,
  resolveHomepageContent,
  sectionHasImage,
  setSectionImage,
  setSectionVisibility,
} from "./schema";
import { HOMEPAGE_SECTION_IDS } from "./sections";

const CLOUDINARY_URL =
  "https://res.cloudinary.com/kishwour/image/upload/v1731600000/kishwour/site/hero_ab12cd.jpg";

describe("homepageContentSchema", () => {
  it("accepts the default document", () => {
    expect(homepageContentSchema.safeParse(defaultHomepageContent).success).toBe(true);
  });

  it("covers every section exactly once, in display order", () => {
    expect(orderedSectionIds(defaultHomepageContent)).toEqual([...HOMEPAGE_SECTION_IDS]);
  });

  it("requires a document for every section", () => {
    const { hero: _hero, ...withoutHero } = defaultHomepageContent;
    expect(homepageContentSchema.safeParse(withoutHero).success).toBe(false);
  });

  it("rejects empty required text and reports the field path", () => {
    const broken = structuredClone(defaultHomepageContent);
    broken.hero.title = "   ";
    const parsed = homepageContentSchema.safeParse(broken);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(["hero", "title"]);
  });

  it("rejects text over the field limit", () => {
    const broken = structuredClone(defaultHomepageContent);
    broken.contact.primaryCtaLabel = "x".repeat(41);
    expect(homepageContentSchema.safeParse(broken).success).toBe(false);
  });

  it("trims text and drops unknown keys", () => {
    const input = structuredClone(defaultHomepageContent) as Record<string, unknown>;
    input["hero"] = { ...defaultHomepageContent.hero, title: "  Spaced  ", rogue: 1 };
    input["unknownSection"] = { nope: true };
    const parsed = homepageContentSchema.parse(input);
    expect(parsed.hero.title).toBe("Spaced");
    expect(parsed.hero).not.toHaveProperty("rogue");
    expect(parsed).not.toHaveProperty("unknownSection");
  });

  it("rejects a non-integer or out-of-range order", () => {
    const broken = structuredClone(defaultHomepageContent);
    broken.about.order = 1.5;
    expect(homepageContentSchema.safeParse(broken).success).toBe(false);
    broken.about.order = 500;
    expect(homepageContentSchema.safeParse(broken).success).toBe(false);
  });

  it("caps the craft points list", () => {
    const broken = structuredClone(defaultHomepageContent);
    broken.craft.points = Array.from({ length: MAX_CRAFT_POINTS + 1 }, () => ({
      title: "t",
      text: "x",
    }));
    expect(homepageContentSchema.safeParse(broken).success).toBe(false);
  });
});

describe("image validation", () => {
  it("accepts a Cloudinary URL with alt text", () => {
    expect(
      homepageImageSchema.safeParse({
        url: CLOUDINARY_URL,
        alt: "Jute bags on a workbench",
        publicId: "kishwour/site/hero_ab12cd",
      }).success,
    ).toBe(true);
  });

  it("rejects non-Cloudinary URLs inside a document", () => {
    const broken = structuredClone(defaultHomepageContent);
    broken.hero.image = {
      url: "https://evil.example/hero.jpg",
      alt: "Hero",
      publicId: "",
    };
    const parsed = homepageContentSchema.safeParse(broken);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(["hero", "image", "url"]);
  });

  it("requires alt text on every image", () => {
    expect(
      homepageImageSchema.safeParse({ url: CLOUDINARY_URL, alt: "  ", publicId: "" })
        .success,
    ).toBe(false);
  });

  it("knows which sections carry an image", () => {
    expect(HOMEPAGE_SECTION_IDS.filter(sectionHasImage)).toEqual([
      "hero",
      "about",
      "craft",
      "sustainability",
    ]);
  });
});

describe("defaults and fallback", () => {
  it("matches the content currently shipped in site-content.ts", () => {
    expect(defaultHomepageContent.hero.title).toBe(homeContent.hero.title);
    expect(defaultHomepageContent.hero.subtitle).toBe(homeContent.hero.subtitle);
    expect(defaultHomepageContent.about.title).toBe(homeContent.about.title);
    expect(defaultHomepageContent.about.body).toBe(homeContent.about.body.join("\n\n"));
    expect(defaultHomepageContent.craft.points).toEqual(
      homeContent.craft.points.map((p) => ({ title: p.title, text: p.text })),
    );
    expect(defaultHomepageContent.contact.title).toBe(homeContent.contact.title);
    // Nothing is hidden by default, so the live homepage is unchanged.
    expect(HOMEPAGE_SECTION_IDS.every((id) => defaultHomepageContent[id].visible)).toBe(
      true,
    );
  });

  it("seeds the defaults with the legacy settings.home texts", () => {
    const seeded = homepageDefaultsFrom({
      heroTitle: "Saved hero",
      heroSubtitle: "Saved subtitle",
      aboutTitle: "Saved about",
      aboutBody: "One.\n\nTwo.",
    });
    expect(seeded.hero.title).toBe("Saved hero");
    expect(seeded.about.body).toBe("One.\n\nTwo.");
    // Untouched sections keep the code defaults.
    expect(seeded.craft.title).toBe(defaultHomepageContent.craft.title);
  });

  it("falls back to the defaults for anything that is not a valid document", () => {
    for (const stored of [null, undefined, 0, "", "{}", [], {}, { hero: {} }]) {
      expect(parseHomepageContent(stored)).toBeNull();
      expect(resolveHomepageContent(stored, defaultHomepageContent)).toBe(
        defaultHomepageContent,
      );
    }
  });

  it("keeps a valid stored document", () => {
    const stored = structuredClone(defaultHomepageContent);
    stored.hero.title = "Published title";
    expect(resolveHomepageContent(stored, defaultHomepageContent).hero.title).toBe(
      "Published title",
    );
  });
});

describe("ordering and visibility", () => {
  it("moves a section and renumbers every order", () => {
    const moved = moveSection(defaultHomepageContent, "contact", -1);
    expect(orderedSectionIds(moved).slice(-2)).toEqual(["contact", "testimonials"]);
    expect(
      HOMEPAGE_SECTION_IDS.map((id) => moved[id].order).sort((a, b) => a - b),
    ).toEqual(HOMEPAGE_SECTION_IDS.map((_, i) => i));
  });

  it("does not move past the ends", () => {
    expect(moveSection(defaultHomepageContent, "hero", -1)).toBe(defaultHomepageContent);
    expect(moveSection(defaultHomepageContent, "contact", 1)).toBe(
      defaultHomepageContent,
    );
  });

  it("normalises duplicate and gapped orders without changing the sequence", () => {
    const messy = structuredClone(defaultHomepageContent);
    messy.hero.order = 40;
    messy.categories.order = 40;
    const normalised = normalizeSectionOrder(messy);
    expect(orderedSectionIds(normalised).slice(-2)).toEqual(["hero", "categories"]);
    expect(normalised.contact.order).toBe(7);
  });

  it("shows and hides one section without touching the others", () => {
    const hidden = setSectionVisibility(defaultHomepageContent, "testimonials", false);
    expect(hidden.testimonials.visible).toBe(false);
    expect(hidden.hero.visible).toBe(true);
    expect(defaultHomepageContent.testimonials.visible).toBe(true);
  });
});

describe("editor helpers", () => {
  it("merges panel values without losing visibility, order or image", () => {
    const withImage = setSectionImage(defaultHomepageContent, "hero", {
      url: CLOUDINARY_URL,
      alt: "Hero",
      publicId: "kishwour/site/hero_ab12cd",
    });
    const hidden = setSectionVisibility(withImage, "hero", false);
    const values = homepageSectionFormSchemas.hero.parse({
      eyebrow: "",
      title: "New heading",
      subtitle: "New subtitle",
      primaryCtaLabel: "Browse",
      secondaryCtaLabel: "",
    });
    const next = applySectionValues(hidden, "hero", values);
    expect(next.hero.title).toBe("New heading");
    expect(next.hero.visible).toBe(false);
    expect(next.hero.order).toBe(0);
    expect(next.hero.image?.url).toBe(CLOUDINARY_URL);
    expect(homepageContentSchema.safeParse(next).success).toBe(true);
  });

  it("removes an image", () => {
    const withImage = setSectionImage(defaultHomepageContent, "about", {
      url: CLOUDINARY_URL,
      alt: "About",
      publicId: "kishwour/site/a",
    });
    expect(setSectionImage(withImage, "about", null).about.image).toBeNull();
  });
});

describe("contentParagraphs", () => {
  it("splits on blank lines", () => {
    expect(contentParagraphs("One.\n\nTwo\nlines.\n\n\n Three. ")).toEqual([
      "One.",
      "Two\nlines.",
      "Three.",
    ]);
  });
});
