import { describe, expect, it } from "vitest";

import {
  coverCropRect,
  DEFAULT_IMAGE_DISPLAY_SETTINGS,
  defaultImageDisplay,
  frameAspectCss,
  frameAspectValue,
  imageDisplayCssVars,
  imageDisplaySchema,
  imageFitStyle,
  isDefaultImageDisplay,
  normalizeDisplaySettings,
  resolveImageDisplay,
  scaleSizesForZoom,
  settingsFromCropRect,
} from "./image-display";
import { homepageImageSchema } from "./schema";

const SAMPLE_URL =
  "https://res.cloudinary.com/demo/image/upload/v1700000000/kishwour/site/hero_abc.jpg";

describe("image-display settings & schema", () => {
  it("keeps backward compatibility when display settings are omitted", () => {
    const parsed = homepageImageSchema.safeParse({
      url: SAMPLE_URL,
      alt: "Artisans weaving jute",
      publicId: "kishwour/site/hero_abc",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.display).toBeUndefined();
      const resolved = resolveImageDisplay(parsed.data.display);
      expect(isDefaultImageDisplay(resolved)).toBe(true);
    }
  });

  it("validates independent desktop and mobile display settings", () => {
    const display = {
      desktop: { mode: "cover" as const, x: 25, y: 75, zoom: 1.5, aspect: "16:9" as const },
      mobile: { mode: "contain" as const, x: 50, y: 50, zoom: 0.9, aspect: "4:5" as const },
    };
    const parsed = homepageImageSchema.safeParse({
      url: SAMPLE_URL,
      alt: "Artisans weaving jute",
      publicId: "kishwour/site/hero_abc",
      display,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.display).toEqual(display);
      expect(parsed.data.display?.desktop.x).toBe(25);
      expect(parsed.data.display?.mobile.x).toBe(50);
    }
  });

  it("clamps zoom in cover mode to at least 100% and rounds coordinates", () => {
    const normalized = normalizeDisplaySettings({
      mode: "cover",
      x: 120.44,
      y: -5,
      zoom: 0.6,
      aspect: "4:3",
    });
    expect(normalized).toEqual({
      mode: "cover",
      x: 100,
      y: 0,
      zoom: 1,
      aspect: "4:3",
    });
  });

  it("computes CSS variables for both mobile and desktop independently", () => {
    const display = defaultImageDisplay();
    display.desktop = { mode: "cover", x: 20, y: 80, zoom: 1.4, aspect: "4:3" };
    display.mobile = { mode: "contain", x: 60, y: 40, zoom: 1, aspect: "1:1" };

    const vars = imageDisplayCssVars(display);
    expect(vars["--mi-fit-d"]).toBe("cover");
    expect(vars["--mi-pos-d"]).toBe("20% 80%");
    expect(vars["--mi-tf-d"]).toBe("scale(1.4)");
    expect(vars["--mi-ar-d"]).toBe("4 / 3");

    expect(vars["--mi-fit-m"]).toBe("contain");
    expect(vars["--mi-pos-m"]).toBe("60% 40%");
    expect(vars["--mi-tf-m"]).toBe("scale(1)");
    expect(vars["--mi-ar-m"]).toBe("1 / 1");
  });

  it("round-trips between cover crop rectangle and zoom/position settings", () => {
    const initial = {
      ...DEFAULT_IMAGE_DISPLAY_SETTINGS,
      mode: "cover" as const,
      x: 35,
      y: 65,
      zoom: 1.6,
    };
    const rect = coverCropRect(initial, 16 / 9, 4 / 3);
    const recovered = settingsFromCropRect(rect, 16 / 9, 4 / 3, initial);
    expect(recovered.zoom).toBeCloseTo(initial.zoom, 1);
    expect(recovered.x).toBeCloseTo(initial.x, 0);
    expect(recovered.y).toBeCloseTo(initial.y, 0);
  });

  it("scales responsive image sizes when zoomed in", () => {
    expect(scaleSizesForZoom("(min-width: 1024px) 50vw, 100vw", 1.5)).toBe(
      "(min-width: 1024px) 75vw, 150vw",
    );
    expect(scaleSizesForZoom("(min-width: 1024px) 50vw, 100vw", 1)).toBe(
      "(min-width: 1024px) 50vw, 100vw",
    );
  });

  it("maps fit modes and aspect ratios accurately", () => {
    expect(imageFitStyle({ ...DEFAULT_IMAGE_DISPLAY_SETTINGS, mode: "original" }).objectFit).toBe(
      "scale-down",
    );
    expect(frameAspectValue("4:5", 1)).toBeCloseTo(0.8, 4);
    expect(frameAspectCss("16:9")).toBe("16 / 9");
    expect(frameAspectCss("auto")).toBeNull();
    expect(imageDisplaySchema.safeParse(defaultImageDisplay()).success).toBe(true);
  });
});
