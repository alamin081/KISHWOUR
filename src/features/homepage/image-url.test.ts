import { describe, expect, it } from "vitest";

import {
  cloudinaryPublicIdFromUrl,
  isCloudinaryDeliveryUrl,
  isCloudinaryDeliveryUrlFor,
  parseCloudinaryUrl,
} from "./image-url";

const VALID =
  "https://res.cloudinary.com/kishwour/image/upload/v1731600000/kishwour/site/hero_ab12cd.jpg";

describe("parseCloudinaryUrl", () => {
  it("reads the cloud name and the public ID", () => {
    expect(parseCloudinaryUrl(VALID)).toEqual({
      cloudName: "kishwour",
      publicId: "kishwour/site/hero_ab12cd",
    });
  });

  it("ignores transformation segments before the version", () => {
    expect(
      parseCloudinaryUrl(
        "https://res.cloudinary.com/demo/image/upload/w_400,h_300,c_fill/f_auto/v12/kishwour/site/a.webp",
      ),
    ).toEqual({ cloudName: "demo", publicId: "kishwour/site/a" });
  });

  it("works without a version segment", () => {
    expect(
      parseCloudinaryUrl("https://res.cloudinary.com/demo/image/upload/sample.png"),
    ).toEqual({ cloudName: "demo", publicId: "sample" });
  });
});

describe("isCloudinaryDeliveryUrl", () => {
  it("accepts our delivery URLs", () => {
    expect(isCloudinaryDeliveryUrl(VALID)).toBe(true);
    expect(isCloudinaryDeliveryUrl(`  ${VALID}  `)).toBe(true);
  });

  it("rejects anything that is not a Cloudinary image delivery URL", () => {
    const rejected = [
      "",
      "not a url",
      "/images/hero.jpg",
      "http://res.cloudinary.com/kishwour/image/upload/v1/a.jpg", // not https
      "https://evil.example/kishwour/image/upload/v1/a.jpg", // other host
      "https://res.cloudinary.com.evil.example/x/image/upload/v1/a.jpg", // lookalike host
      "https://res.cloudinary.com/kishwour/raw/upload/v1/a.zip", // not an image
      "https://res.cloudinary.com/kishwour/image/fetch/https://evil.example/a.jpg", // remote fetch
      "https://res.cloudinary.com/kishwour/image/upload/v1/a.jpg?onerror=x", // query string
      "https://res.cloudinary.com/kishwour/image/upload/v1/../../a.jpg", // traversal
      "https://user:pass@res.cloudinary.com/kishwour/image/upload/v1/a.jpg", // credentials
      "javascript:alert(1)",
    ];
    for (const url of rejected) expect(isCloudinaryDeliveryUrl(url), url).toBe(false);
  });
});

describe("isCloudinaryDeliveryUrlFor", () => {
  it("pins the URL to one cloud name", () => {
    expect(isCloudinaryDeliveryUrlFor(VALID, "kishwour")).toBe(true);
    expect(isCloudinaryDeliveryUrlFor(VALID, "someone-else")).toBe(false);
  });
});

describe("cloudinaryPublicIdFromUrl", () => {
  it("returns the public ID, or null for foreign URLs", () => {
    expect(cloudinaryPublicIdFromUrl(VALID)).toBe("kishwour/site/hero_ab12cd");
    expect(cloudinaryPublicIdFromUrl("https://evil.example/a.jpg")).toBeNull();
  });
});
