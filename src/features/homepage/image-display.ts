import { z } from "zod";

/**
 * Non-destructive display settings for editorial images (fit mode, crop, zoom, position).
 *
 * The photo in Cloudinary is never modified: these settings are stored next to the image URL
 * inside the page document and applied with CSS `object-fit`, `object-position` and
 * `transform: scale()`. Changing the crop or zoom therefore never needs a new upload, and the
 * original quality is kept.
 *
 * Pure and isomorphic on purpose: the admin editor preview and the public page compute the
 * exact same CSS from the exact same functions, so what an admin sees is what visitors get.
 *
 * Crop model: in Cover mode the visible part of the photo is fully described by the frame
 * shape, the zoom level and the focal position (x / y). `coverCropRect` converts those into a
 * crop rectangle and `settingsFromCropRect` converts a rectangle back, so the crop tool and
 * the zoom / position controls always stay in sync.
 */

export const IMAGE_FIT_MODES = ["cover", "contain", "original"] as const;
export type ImageFitMode = (typeof IMAGE_FIT_MODES)[number];

/** Frame shapes an admin may pick. "auto" keeps the section's own design. */
export const FRAME_ASPECTS = [
  "auto",
  "1:1",
  "4:3",
  "3:4",
  "4:5",
  "5:4",
  "3:2",
  "2:3",
  "16:9",
] as const;
export type FrameAspect = (typeof FRAME_ASPECTS)[number];

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 4;
/** Cover must always fill the frame, so it never zooms out below 100 %. */
export const COVER_ZOOM_MIN = 1;

/**
 * Viewports narrower than this use the mobile settings (Tailwind's `sm` breakpoint, where the
 * storefront itself switches from the phone layout). Kept in sync with `MediaSlot`.
 */
export const MOBILE_BREAKPOINT_PX = 640;

export const imageDisplaySettingsSchema = z.object({
  mode: z.enum(IMAGE_FIT_MODES),
  /** Horizontal focal position, 0 = left edge, 100 = right edge. */
  x: z.number().min(0).max(100),
  /** Vertical focal position, 0 = top edge, 100 = bottom edge. */
  y: z.number().min(0).max(100),
  zoom: z.number().min(ZOOM_MIN).max(ZOOM_MAX),
  aspect: z.enum(FRAME_ASPECTS),
});

export type ImageDisplaySettings = z.infer<typeof imageDisplaySettingsSchema>;

/** Desktop and mobile are stored separately: changing one never changes the other. */
export const imageDisplaySchema = z.object({
  desktop: imageDisplaySettingsSchema,
  mobile: imageDisplaySettingsSchema,
});

export type ImageDisplay = z.infer<typeof imageDisplaySchema>;
export type ImageDevice = keyof ImageDisplay;
export const IMAGE_DEVICES = ["desktop", "mobile"] as const satisfies readonly ImageDevice[];

/** The section's natural frame shape (width / height) per device. */
export type ImageFrameAspects = Record<ImageDevice, number>;

/** Exactly how images rendered before this feature existed: `object-cover`, centred. */
export const DEFAULT_IMAGE_DISPLAY_SETTINGS: ImageDisplaySettings = {
  mode: "cover",
  x: 50,
  y: 50,
  zoom: 1,
  aspect: "auto",
};

export function defaultImageDisplay(): ImageDisplay {
  return {
    desktop: { ...DEFAULT_IMAGE_DISPLAY_SETTINGS },
    mobile: { ...DEFAULT_IMAGE_DISPLAY_SETTINGS },
  };
}

/** Stored settings, or the defaults for images saved before this feature existed. */
export function resolveImageDisplay(display: ImageDisplay | null | undefined): ImageDisplay {
  if (!display) return defaultImageDisplay();
  return {
    desktop: normalizeDisplaySettings(display.desktop),
    mobile: normalizeDisplaySettings(display.mobile),
  };
}

function sameSettings(a: ImageDisplaySettings, b: ImageDisplaySettings): boolean {
  return (
    a.mode === b.mode &&
    a.x === b.x &&
    a.y === b.y &&
    a.zoom === b.zoom &&
    a.aspect === b.aspect
  );
}

export function isDefaultImageDisplay(display: ImageDisplay): boolean {
  return (
    sameSettings(display.desktop, DEFAULT_IMAGE_DISPLAY_SETTINGS) &&
    sameSettings(display.mobile, DEFAULT_IMAGE_DISPLAY_SETTINGS)
  );
}

const clamp = (value: number, min: number, max: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function minZoomFor(mode: ImageFitMode): number {
  return mode === "cover" ? COVER_ZOOM_MIN : ZOOM_MIN;
}

/** Clamps and rounds every value so stored documents stay small and always valid. */
export function normalizeDisplaySettings(
  settings: ImageDisplaySettings,
): ImageDisplaySettings {
  const mode = (IMAGE_FIT_MODES as readonly string[]).includes(settings.mode)
    ? settings.mode
    : DEFAULT_IMAGE_DISPLAY_SETTINGS.mode;
  const aspect = (FRAME_ASPECTS as readonly string[]).includes(settings.aspect)
    ? settings.aspect
    : DEFAULT_IMAGE_DISPLAY_SETTINGS.aspect;
  return {
    mode,
    aspect,
    x: round(clamp(settings.x, 0, 100), 1),
    y: round(clamp(settings.y, 0, 100), 1),
    zoom: round(clamp(settings.zoom, minZoomFor(mode), ZOOM_MAX), 2),
  };
}

/* ------------------------------------------------------------- frame shape */

/** "4:3" → 4/3; "auto" → the section's own shape. */
export function frameAspectValue(aspect: FrameAspect, fallback: number): number {
  if (aspect === "auto") return fallback;
  const [w, h] = aspect.split(":").map(Number);
  return w && h ? w / h : fallback;
}

/** CSS `aspect-ratio` value, or null for the section's own shape. */
export function frameAspectCss(aspect: FrameAspect): string | null {
  if (aspect === "auto") return null;
  const [w, h] = aspect.split(":");
  return `${w} / ${h}`;
}

/** 1.25 → "5:4", 0.8 → "4:5", for labels. */
export function describeAspect(value: number): string {
  for (const aspect of FRAME_ASPECTS) {
    if (aspect !== "auto" && Math.abs(frameAspectValue(aspect, 0) - value) < 0.01) {
      return aspect;
    }
  }
  return value.toFixed(2);
}

/* ------------------------------------------------------------------- CSS */

export type ImageFitStyle = {
  objectFit: "cover" | "contain" | "scale-down";
  objectPosition: string;
  transform: string;
  transformOrigin: string;
};

const CSS_FIT: Record<ImageFitMode, ImageFitStyle["objectFit"]> = {
  cover: "cover",
  contain: "contain",
  // Natural proportions, never enlarged beyond the file's own size and never cropped.
  original: "scale-down",
};

/**
 * The CSS for one device. The scale origin is the focal point, so zooming keeps the chosen
 * part of the photo in place.
 */
export function imageFitStyle(settings: ImageDisplaySettings): ImageFitStyle {
  const s = normalizeDisplaySettings(settings);
  const position = `${s.x}% ${s.y}%`;
  return {
    objectFit: CSS_FIT[s.mode],
    objectPosition: position,
    transform: `scale(${s.zoom})`,
    transformOrigin: position,
  };
}

/**
 * CSS custom properties consumed by `MediaSlot`, which switches between the mobile and the
 * desktop values with a media query - no JavaScript, so it works on the server-rendered page.
 */
export function imageDisplayCssVars(display: ImageDisplay): Record<string, string> {
  const vars: Record<string, string> = {};
  const suffix: Record<ImageDevice, string> = { mobile: "m", desktop: "d" };
  for (const device of IMAGE_DEVICES) {
    const settings = display[device];
    const style = imageFitStyle(settings);
    const key = suffix[device];
    vars[`--mi-fit-${key}`] = style.objectFit;
    vars[`--mi-pos-${key}`] = style.objectPosition;
    vars[`--mi-tf-${key}`] = style.transform;
    const aspect = frameAspectCss(settings.aspect);
    if (aspect) vars[`--mi-ar-${key}`] = aspect;
  }
  return vars;
}

/**
 * Scales the `vw` values of a `sizes` attribute by the zoom, so a zoomed-in photo is
 * requested at a resolution that stays sharp instead of being upscaled.
 */
export function scaleSizesForZoom(sizes: string, zoom: number): string {
  if (!(zoom > 1)) return sizes;
  return sizes.replace(/(\d+(?:\.\d+)?)vw/g, (_match, value: string) => {
    return `${Math.min(400, Math.round(Number(value) * zoom))}vw`;
  });
}

export function maxZoom(display: ImageDisplay): number {
  return Math.max(display.desktop.zoom, display.mobile.zoom);
}

/* ------------------------------------------------------------ crop maths */

/**
 * Rendered photo size relative to the frame (1 = exactly the frame's width / height),
 * including the zoom. "original" is treated like "contain" here: for typical uploads (larger
 * than the frame) `scale-down` renders the same.
 */
export function renderedRatio(
  settings: ImageDisplaySettings,
  imageAspect: number,
  frameAspect: number,
): { w: number; h: number } {
  const ia = imageAspect > 0 ? imageAspect : frameAspect;
  const fa = frameAspect > 0 ? frameAspect : 1;
  const base =
    settings.mode === "cover"
      ? { w: Math.max(1, ia / fa), h: Math.max(1, fa / ia) }
      : { w: Math.min(1, ia / fa), h: Math.min(1, fa / ia) };
  return { w: base.w * settings.zoom, h: base.h * settings.zoom };
}

/** Part of the photo that is visible, as fractions (0-1) of the photo's width and height. */
export type CropRect = { left: number; top: number; width: number; height: number };

/**
 * The visible part of the photo in Cover mode.
 *
 * With `object-position: x% y%` and `transform-origin: x% y%` the photo's left edge sits at
 * `(frame - rendered) * x / 100`, which gives `left = (1 - width) * x / 100`.
 */
export function coverCropRect(
  settings: ImageDisplaySettings,
  imageAspect: number,
  frameAspect: number,
): CropRect {
  const ratio = renderedRatio(
    { ...settings, mode: "cover" },
    imageAspect,
    frameAspect,
  );
  const width = Math.min(1, 1 / ratio.w);
  const height = Math.min(1, 1 / ratio.h);
  return {
    width,
    height,
    left: (1 - width) * (settings.x / 100),
    top: (1 - height) * (settings.y / 100),
  };
}

/** Inverse of `coverCropRect`: the zoom and position that show exactly `rect`. */
export function settingsFromCropRect(
  rect: Pick<CropRect, "left" | "top" | "width">,
  imageAspect: number,
  frameAspect: number,
  previous: ImageDisplaySettings,
): ImageDisplaySettings {
  const base = renderedRatio(
    { ...previous, mode: "cover", zoom: 1 },
    imageAspect,
    frameAspect,
  );
  const zoom = clamp(1 / (base.w * Math.max(rect.width, 0.0001)), COVER_ZOOM_MIN, ZOOM_MAX);
  const width = Math.min(1, 1 / (base.w * zoom));
  const height = Math.min(1, 1 / (base.h * zoom));
  const x = width < 0.999 ? (rect.left / (1 - width)) * 100 : 50;
  const y = height < 0.999 ? (rect.top / (1 - height)) * 100 : 50;
  return normalizeDisplaySettings({ ...previous, mode: "cover", zoom, x, y });
}

/**
 * How many position-percent one frame-percent of pointer movement is worth, so dragging the
 * photo follows the pointer. Negative in Cover mode (dragging right reveals the left side),
 * zero on an axis where the photo cannot move.
 */
export function panSensitivity(
  settings: ImageDisplaySettings,
  imageAspect: number,
  frameAspect: number,
): { x: number; y: number } {
  const ratio = renderedRatio(settings, imageAspect, frameAspect);
  const axis = (r: number) => (Math.abs(1 - r) < 0.01 ? 0 : 1 / (1 - r));
  return { x: axis(ratio.w), y: axis(ratio.h) };
}
