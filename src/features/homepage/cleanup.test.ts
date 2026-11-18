import { describe, expect, it } from "vitest";

import {
  collectImages,
  collectPublicIds,
  collectPublicIdsFrom,
  imagePublicId,
  isSiteUpload,
} from "./cleanup";
import {
  defaultHomepageContent,
  type HomepageContent,
  type HomepageImageSectionId,
  setSectionImage,
} from "./schema";
import { testimonialWithPhoto } from "./test-helpers";

const url = (publicId: string) =>
  `https://res.cloudinary.com/kishwour/image/upload/v1731600000/${publicId}.jpg`;

function withImages(
  entries: Partial<Record<HomepageImageSectionId, string>>,
): HomepageContent {
  let content = defaultHomepageContent;
  for (const [section, publicId] of Object.entries(entries)) {
    content = setSectionImage(content, section as HomepageImageSectionId, {
      url: url(publicId),
      alt: "Photo",
      publicId,
    });
  }
  return content;
}

describe("collecting image references", () => {
  it("finds the image of every image-bearing section", () => {
    const content = withImages({
      hero: "kishwour/site/hero",
      sustainability: "kishwour/site/leaf",
    });
    expect(collectImages(content).map((i) => i.publicId)).toEqual([
      "kishwour/site/hero",
      "kishwour/site/leaf",
    ]);
    expect([...collectPublicIds(content)]).toEqual([
      "kishwour/site/hero",
      "kishwour/site/leaf",
    ]);
  });

  it("also finds testimonial portraits", () => {
    const content = structuredClone(withImages({ hero: "kishwour/site/hero" }));
    content.testimonials.items = [
      testimonialWithPhoto("kishwour/site/buyer-1"),
      testimonialWithPhoto("kishwour/site/buyer-2"),
      { ...testimonialWithPhoto("kishwour/site/unused"), photo: null },
    ];
    expect([...collectPublicIds(content)]).toEqual([
      "kishwour/site/hero",
      "kishwour/site/buyer-1",
      "kishwour/site/buyer-2",
    ]);
  });

  it("handles a document without images and a missing document", () => {
    expect(collectImages(defaultHomepageContent)).toEqual([]);
    expect(collectImages(null)).toEqual([]);
    expect(collectPublicIds(null).size).toBe(0);
  });

  it("derives the public ID from the URL when it was not stored", () => {
    expect(
      imagePublicId({ url: url("kishwour/site/legacy"), alt: "a", publicId: "  " }),
    ).toBe("kishwour/site/legacy");
    expect(
      imagePublicId({ url: "https://evil.example/a.jpg", alt: "a", publicId: "" }),
    ).toBeNull();
  });

  it("merges the references of several documents and ignores nulls", () => {
    expect([
      ...collectPublicIdsFrom([
        withImages({ hero: "kishwour/site/a" }),
        withImages({ hero: "kishwour/site/a", about: "kishwour/site/b" }),
        null,
      ]),
    ]).toEqual(["kishwour/site/a", "kishwour/site/b"]);
    expect(collectPublicIdsFrom([]).size).toBe(0);
  });
});

describe("isSiteUpload", () => {
  it("only recognises assets in the site folder", () => {
    expect(isSiteUpload("kishwour/site/hero_ab12")).toBe(true);
    expect(isSiteUpload("kishwour/products/shoe_1")).toBe(false);
    expect(isSiteUpload("kishwour/categories/jute")).toBe(false);
    expect(isSiteUpload("kishwour/site")).toBe(false);
    expect(isSiteUpload("")).toBe(false);
  });
});
