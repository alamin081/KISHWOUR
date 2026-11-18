import { describe, expect, it } from "vitest";

import { changedSectionIds, sameHomepageContent } from "./compare";
import {
  defaultHomepageContent,
  moveSection,
  setSectionImage,
  setSectionVisibility,
} from "./schema";

describe("sameHomepageContent", () => {
  it("ignores key order", () => {
    const reordered = Object.fromEntries(
      Object.entries(structuredClone(defaultHomepageContent)).reverse(),
    ) as typeof defaultHomepageContent;
    expect(Object.keys(reordered)[0]).not.toBe(Object.keys(defaultHomepageContent)[0]);
    expect(sameHomepageContent(defaultHomepageContent, reordered)).toBe(true);
  });

  it("detects text, visibility, order and image changes", () => {
    const text = structuredClone(defaultHomepageContent);
    text.hero.title = "Changed";
    expect(sameHomepageContent(defaultHomepageContent, text)).toBe(false);

    expect(
      sameHomepageContent(
        defaultHomepageContent,
        setSectionVisibility(defaultHomepageContent, "craft", false),
      ),
    ).toBe(false);

    expect(
      sameHomepageContent(
        defaultHomepageContent,
        moveSection(defaultHomepageContent, "about", 1),
      ),
    ).toBe(false);

    expect(
      sameHomepageContent(
        defaultHomepageContent,
        setSectionImage(defaultHomepageContent, "hero", {
          url: "https://res.cloudinary.com/kishwour/image/upload/v1/kishwour/site/a.jpg",
          alt: "A",
          publicId: "kishwour/site/a",
        }),
      ),
    ).toBe(false);
  });

  it("detects list length changes", () => {
    const fewer = structuredClone(defaultHomepageContent);
    fewer.wholesale.points = fewer.wholesale.points.slice(0, 1);
    expect(sameHomepageContent(defaultHomepageContent, fewer)).toBe(false);
  });
});

describe("changedSectionIds", () => {
  it("is empty for identical documents", () => {
    expect(
      changedSectionIds(defaultHomepageContent, structuredClone(defaultHomepageContent)),
    ).toEqual([]);
  });

  it("lists only the sections that differ", () => {
    const edited = structuredClone(defaultHomepageContent);
    edited.hero.title = "Changed";
    edited.contact.text = "Changed too";
    expect(changedSectionIds(defaultHomepageContent, edited)).toEqual([
      "hero",
      "contact",
    ]);
  });

  it("reports both sections involved in a move", () => {
    expect(
      changedSectionIds(
        defaultHomepageContent,
        moveSection(defaultHomepageContent, "about", 1),
      ),
    ).toEqual(["about", "craft"]);
  });
});
