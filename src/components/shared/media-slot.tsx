"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, useState } from "react";

import {
  type ImageDisplay,
  imageDisplayCssVars,
  isDefaultImageDisplay,
  maxZoom,
  resolveImageDisplay,
  scaleSizesForZoom,
} from "@/features/homepage/image-display";
import { cn } from "@/lib/utils";

export type MediaSlotImage = {
  src: string;
  alt: string;
  /** Optional fit mode, crop, zoom and position per device (Desktop / Mobile). */
  display?: ImageDisplay | undefined;
};

type MediaSlotProps = {
  /** Structural on purpose: accepts `ContentImage` and stored homepage images alike. */
  image?: MediaSlotImage;
  /** Describes the photo that belongs here, e.g. "Lifestyle photography". */
  label: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

/**
 * Responsive classes that read the CSS variables emitted by `imageDisplayCssVars`.
 * Mobile (`< 640px`, Tailwind `sm`) uses `--mi-*-m`; desktop (`>= 640px`) uses `--mi-*-d`.
 * Because PreviewFrame renders inside a real iframe whose width changes between "100%"
 * (Desktop) and "390px" (Mobile), these `sm:` media-query classes automatically switch
 * inside the Admin Editor preview as well as on the live website.
 */
export const RESPONSIVE_IMAGE_DISPLAY_CLASS = cn(
  "[object-fit:var(--mi-fit-m,cover)] sm:[object-fit:var(--mi-fit-d,cover)]",
  "[object-position:var(--mi-pos-m,50%_50%)] sm:[object-position:var(--mi-pos-d,50%_50%)]",
  "[transform-origin:var(--mi-pos-m,50%_50%)] sm:[transform-origin:var(--mi-pos-d,50%_50%)]",
  "[transform:var(--mi-tf-m,scale(1))] sm:[transform:var(--mi-tf-d,scale(1))]",
);

/**
 * Editorial photo slot. Renders the photo when one is configured (homepage content in the
 * database, or src/content/site-content.ts), otherwise a clearly labelled placeholder.
 * Also falls back gracefully to the placeholder if the image URL fails to load.
 */
export function MediaSlot({
  image,
  label,
  className,
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: MediaSlotProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = image?.src?.trim() ?? "";
  const showImage = Boolean(image && src && failedSrc !== src);

  const display = resolveImageDisplay(image?.display);
  const hasCustomDisplay = !isDefaultImageDisplay(display);
  const cssVars = hasCustomDisplay
    ? (imageDisplayCssVars(display) as CSSProperties)
    : undefined;
  const effectiveSizes = hasCustomDisplay
    ? scaleSizesForZoom(sizes, maxZoom(display))
    : sizes;

  const hasMobileAspect = display.mobile.aspect !== "auto";
  const hasDesktopAspect = display.desktop.aspect !== "auto";

  return (
    <div
      style={cssVars}
      className={cn(
        "relative overflow-hidden rounded-xl bg-secondary",
        className,
        hasMobileAspect && "max-sm:[aspect-ratio:var(--mi-ar-m)]",
        hasDesktopAspect && "sm:[aspect-ratio:var(--mi-ar-d)]",
      )}
    >
      {showImage && image ? (
        <Image
          key={src}
          src={src}
          alt={image.alt || label}
          fill
          priority={priority}
          sizes={effectiveSizes}
          onError={() => setFailedSrc(src)}
          className={
            hasCustomDisplay ? RESPONSIVE_IMAGE_DISPLAY_CLASS : "object-cover"
          }
        />
      ) : (
        <div
          role="img"
          aria-label={`${label} coming soon`}
          className="flex size-full flex-col items-center justify-center gap-3 bg-[repeating-linear-gradient(45deg,transparent_0_12px,rgb(166_110_67/0.07)_12px_13px)] p-6 text-center text-jute-deep"
        >
          <Camera className="size-8" strokeWidth={1.4} aria-hidden />
          <span className="text-[0.7rem] font-semibold tracking-[0.18em] uppercase">
            {label} coming soon
          </span>
        </div>
      )}
    </div>
  );
}
