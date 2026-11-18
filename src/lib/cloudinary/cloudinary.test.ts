import { describe, expect, it } from "vitest";

import { isCloudinaryUrl, signCloudinaryParams } from "./index";

describe("signCloudinaryParams", () => {
  it("matches Cloudinary's documented example", () => {
    // https://cloudinary.com/documentation/authentication_signatures (example values)
    expect(
      signCloudinaryParams(
        {
          eager: "w_400,h_300,c_pad|w_260,h_200,c_crop",
          public_id: "sample_image",
          timestamp: 1315060510,
        },
        "abcd",
      ),
    ).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });
});

describe("isCloudinaryUrl", () => {
  it("accepts only https res.cloudinary.com", () => {
    expect(isCloudinaryUrl("https://res.cloudinary.com/demo/image/upload/x.jpg")).toBe(
      true,
    );
    expect(isCloudinaryUrl("http://res.cloudinary.com/demo/x.jpg")).toBe(false);
    expect(isCloudinaryUrl("https://evil.example/x.jpg")).toBe(false);
  });
});
