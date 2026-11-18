"use client";

import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Copy,
  Crop,
  Maximize2,
  Minimize2,
  Monitor,
  Move,
  RotateCcw,
  Scan,
  Smartphone,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type CropRect,
  coverCropRect,
  DEFAULT_IMAGE_DISPLAY_SETTINGS,
  defaultImageDisplay,
  describeAspect,
  FRAME_ASPECTS,
  IMAGE_DEVICES,
  type ImageDevice,
  type ImageDisplay,
  type ImageDisplaySettings,
  type ImageFitMode,
  type ImageFrameAspects,
  imageFitStyle,
  minZoomFor,
  normalizeDisplaySettings,
  panSensitivity,
  resolveImageDisplay,
  settingsFromCropRect,
  ZOOM_MAX,
  frameAspectValue,
} from "@/features/homepage/image-display";
import { type HomepageImage } from "@/features/homepage/schema";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: HomepageImage;
  label: string;
  portrait?: boolean;
  /** Default frame aspect ratios (width / height) for Desktop and Mobile. */
  defaultAspects?: ImageFrameAspects;
  /** Initial active device tab when opening the editor. */
  initialDevice?: ImageDevice;
  onSave: (display: ImageDisplay) => void;
};

const DEFAULT_SECTION_ASPECTS: ImageFrameAspects = {
  desktop: 4 / 3,
  mobile: 4 / 3,
};

const PORTRAIT_ASPECTS: ImageFrameAspects = {
  desktop: 1,
  mobile: 1,
};

const MODE_OPTIONS: {
  id: ImageFitMode;
  label: string;
  hint: string;
  icon: typeof Maximize2;
}[] = [
  {
    id: "cover",
    label: "Cover",
    hint: "Fills the entire container, keeps aspect ratio, crops overflow.",
    icon: Maximize2,
  },
  {
    id: "contain",
    label: "Contain",
    hint: "Shows the full image without cropping; leaves space if ratios differ.",
    icon: Minimize2,
  },
  {
    id: "original",
    label: "Original",
    hint: "Natural aspect ratio, never stretched or unnecessarily cropped.",
    icon: Scan,
  },
];

const POSITION_PRESETS: {
  label: string;
  x?: number;
  y?: number;
  icon: typeof AlignCenterHorizontal;
}[] = [
  { label: "Left", x: 0, icon: AlignStartVertical },
  { label: "Center X", x: 50, icon: AlignCenterVertical },
  { label: "Right", x: 100, icon: AlignEndVertical },
  { label: "Top", y: 0, icon: AlignStartHorizontal },
  { label: "Center Y", y: 50, icon: AlignCenterHorizontal },
  { label: "Bottom", y: 100, icon: AlignEndHorizontal },
];

const NINE_POINT_GRID: { label: string; x: number; y: number }[] = [
  { label: "Top left", x: 0, y: 0 },
  { label: "Top center", x: 50, y: 0 },
  { label: "Top right", x: 100, y: 0 },
  { label: "Middle left", x: 0, y: 50 },
  { label: "Center", x: 50, y: 50 },
  { label: "Middle right", x: 100, y: 50 },
  { label: "Bottom left", x: 0, y: 100 },
  { label: "Bottom center", x: 50, y: 100 },
  { label: "Bottom right", x: 100, y: 100 },
];

type ToolMode = "preview" | "crop";

/**
 * Interactive modal for resizing, cropping, zooming and positioning an uploaded image
 * separately for Desktop and Mobile layouts.
 */
export function ImageEditorDialog({
  open,
  onOpenChange,
  image,
  label,
  portrait = false,
  defaultAspects,
  initialDevice = "desktop",
  onSave,
}: Props) {
  const baseId = useId();
  const baseAspects = portrait
    ? PORTRAIT_ASPECTS
    : (defaultAspects ?? DEFAULT_SECTION_ASPECTS);

  const [device, setDevice] = useState<ImageDevice>(initialDevice);
  const [display, setDisplay] = useState<ImageDisplay>(() =>
    resolveImageDisplay(image.display),
  );
  const [tool, setTool] = useState<ToolMode>("preview");
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({
    w: 4,
    h: 3,
  });

  const current: ImageDisplaySettings = display[device];
  const otherDevice: ImageDevice = device === "desktop" ? "mobile" : "desktop";
  const naturalAspect =
    naturalSize.w > 0 && naturalSize.h > 0 ? naturalSize.w / naturalSize.h : 4 / 3;
  const effectiveFrameAspect = portrait
    ? 1
    : frameAspectValue(current.aspect, baseAspects[device]);

  const updateCurrent = (patch: Partial<ImageDisplaySettings>) => {
    setDisplay((prev) => {
      const merged: ImageDisplaySettings = { ...prev[device], ...patch };
      return {
        ...prev,
        [device]: normalizeDisplaySettings(merged),
      };
    });
  };

  const resetCurrentDevice = () => {
    setDisplay((prev) => ({
      ...prev,
      [device]: { ...DEFAULT_IMAGE_DISPLAY_SETTINGS },
    }));
  };

  const resetAllDevices = () => {
    setDisplay(defaultImageDisplay());
  };

  const copyToOtherDevice = () => {
    setDisplay((prev) => ({
      ...prev,
      [otherDevice]: { ...prev[device] },
    }));
  };

  const zoomMin = minZoomFor(current.mode);
  const zoomPercent = Math.round(current.zoom * 100);

  const stepZoom = (delta: number) => {
    updateCurrent({ zoom: Number((current.zoom + delta).toFixed(2)) });
  };

  // Parse aspect ratio into numeric W and H for the custom size controls.
  const currentAspectParts = (() => {
    const ratio = effectiveFrameAspect;
    if (current.aspect !== "auto") {
      const [w, h] = current.aspect.split(":").map(Number);
      if (w && h) return { w, h };
    }
    const desc = describeAspect(ratio);
    if (desc.includes(":")) {
      const [w, h] = desc.split(":").map(Number);
      if (w && h) return { w, h };
    }
    return { w: Math.round(ratio * 100), h: 100 };
  })();

  const handleSave = () => {
    onSave({
      desktop: normalizeDisplaySettings(display.desktop),
      mobile: normalizeDisplaySettings(display.mobile),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b bg-card px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="font-sans text-lg font-semibold">
                Edit Image — {label}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                Adjust display mode, crop, zoom, frame size and position separately for
                Desktop and Mobile. Original image quality is preserved.
              </DialogDescription>
            </div>

            {/* Device Tabs: Desktop Image Settings / Mobile Image Settings */}
            <div
              role="tablist"
              aria-label="Device image settings"
              className="flex rounded-lg border bg-background p-1"
            >
              {IMAGE_DEVICES.map((dev) => {
                const Icon = dev === "desktop" ? Monitor : Smartphone;
                const active = device === dev;
                return (
                  <button
                    key={dev}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setDevice(dev)}
                    className={cn(
                      "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "bg-forest text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {dev === "desktop"
                      ? "Desktop Image Settings"
                      : "Mobile Image Settings"}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1.2fr_1fr]">
          {/* Left column: Live Preview + Interactive Drag / Crop */}
          <div className="flex flex-col justify-between gap-4 border-b bg-secondary/30 p-5 lg:border-r lg:border-b-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-charcoal px-2 py-0.5 text-[0.7rem] font-semibold tracking-wider text-warm-white uppercase">
                  {device === "desktop" ? "Desktop Preview" : "Mobile Preview"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {current.mode.toUpperCase()} · {zoomPercent}% · X:{Math.round(current.x)}%
                  Y:{Math.round(current.y)}%
                </span>
              </div>

              {/* Tool switcher: Live Position Drag vs Interactive Crop Box */}
              <div
                role="group"
                aria-label="Preview interaction mode"
                className="flex rounded-md border bg-background p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={tool === "preview"}
                  onClick={() => setTool("preview")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    tool === "preview"
                      ? "bg-forest text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <Move className="size-3.5" aria-hidden />
                  Drag Position
                </button>
                <button
                  type="button"
                  aria-pressed={tool === "crop"}
                  onClick={() => {
                    if (current.mode !== "cover") {
                      updateCurrent({ mode: "cover" });
                    }
                    setTool("crop");
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    tool === "crop"
                      ? "bg-forest text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <Crop className="size-3.5" aria-hidden />
                  Crop Tool
                </button>
              </div>
            </div>

            {/* Canvas area */}
            <div className="flex min-h-[20rem] flex-1 items-center justify-center rounded-xl border bg-charcoal/5 p-4">
              {tool === "crop" ? (
                <InteractiveCropStage
                  imageUrl={image.url}
                  imageAlt={image.alt}
                  settings={current}
                  imageAspect={naturalAspect}
                  frameAspect={effectiveFrameAspect}
                  onImageLoad={(w, h) => setNaturalSize({ w, h })}
                  onChange={updateCurrent}
                />
              ) : (
                <InteractivePreviewStage
                  imageUrl={image.url}
                  imageAlt={image.alt}
                  settings={current}
                  device={device}
                  portrait={portrait}
                  imageAspect={naturalAspect}
                  frameAspect={effectiveFrameAspect}
                  onImageLoad={(w, h) => setNaturalSize({ w, h })}
                  onChange={updateCurrent}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>
                {tool === "crop"
                  ? "Drag inside the crop box to move it, or drag a corner handle to resize the crop area."
                  : "Drag the image with your mouse to reposition it, or use the controls on the right."}
              </p>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={copyToOtherDevice}
                title={`Copy ${device} settings to ${otherDevice}`}
              >
                <Copy className="size-3.5" aria-hidden />
                Copy to {otherDevice === "desktop" ? "Desktop" : "Mobile"}
              </Button>
            </div>
          </div>

          {/* Right column: Controls */}
          <div className="space-y-5 overflow-y-auto p-5">
            {/* 1. Display Mode Selector (Cover / Contain / Original) */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  1. Image Display Mode ({device})
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MODE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = current.mode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        updateCurrent({ mode: option.id });
                        if (option.id !== "cover" && tool === "crop") {
                          setTool("preview");
                        }
                      }}
                      className={cn(
                        "flex cursor-pointer flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors",
                        active
                          ? "border-forest bg-forest/10 text-forest ring-1 ring-forest"
                          : "bg-background hover:bg-secondary/60",
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-semibold">
                        <Icon className="size-3.5" aria-hidden />
                        {option.label}
                      </span>
                      <span className="text-[0.68rem] leading-snug text-muted-foreground">
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. Frame Size / Aspect Ratio (Width & Height control) */}
            {!portrait ? (
              <section className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    2. Frame Size &amp; Aspect Ratio (Width × Height)
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Default: {describeAspect(baseAspects[device])}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FRAME_ASPECTS.map((aspect) => {
                    const active = current.aspect === aspect;
                    return (
                      <button
                        key={aspect}
                        type="button"
                        aria-pressed={active}
                        onClick={() => updateCurrent({ aspect })}
                        className={cn(
                          "cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-forest bg-forest text-primary-foreground"
                            : "bg-background hover:bg-secondary",
                        )}
                      >
                        {aspect === "auto"
                          ? `Section default (${describeAspect(baseAspects[device])})`
                          : aspect}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[0.7rem] text-muted-foreground">
                  Current container ratio: {currentAspectParts.w} : {currentAspectParts.h}{" "}
                  (Original photo: {naturalSize.w} × {naturalSize.h}px)
                </p>
              </section>
            ) : null}

            {/* 3. Zoom Control (Zoom In / Out buttons + Slider + Percentage) */}
            <section className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`${baseId}-zoom`}
                  className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  {portrait ? "2." : "3."} Image Zoom &amp; Scale
                </label>
                <span className="text-xs font-semibold tabular-nums">{zoomPercent}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="outline"
                  aria-label="Zoom out"
                  disabled={current.zoom <= zoomMin}
                  onClick={() => stepZoom(-0.1)}
                >
                  <ZoomOut />
                </Button>
                <input
                  id={`${baseId}-zoom`}
                  type="range"
                  min={zoomMin}
                  max={ZOOM_MAX}
                  step={0.02}
                  value={current.zoom}
                  onChange={(e) => updateCurrent({ zoom: Number(e.target.value) })}
                  className="h-2 flex-1 cursor-pointer accent-forest"
                />
                <Button
                  type="button"
                  size="icon-xs"
                  variant="outline"
                  aria-label="Zoom in"
                  disabled={current.zoom >= ZOOM_MAX}
                  onClick={() => stepZoom(0.1)}
                >
                  <ZoomIn />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={current.zoom === 1}
                  onClick={() => updateCurrent({ zoom: 1 })}
                >
                  100%
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[0.75, 1, 1.25, 1.5, 2, 2.5, 3]
                  .filter((z) => z >= zoomMin)
                  .map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => updateCurrent({ zoom: z })}
                      className={cn(
                        "cursor-pointer rounded border px-2 py-0.5 text-[0.7rem] font-medium tabular-nums transition-colors",
                        Math.abs(current.zoom - z) < 0.02
                          ? "border-forest bg-forest text-primary-foreground"
                          : "bg-background hover:bg-secondary",
                      )}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
              </div>
            </section>

            {/* 4. Position Control (Quick presets + 9-point grid + X/Y sliders) */}
            <section className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {portrait ? "3." : "4."} Image Position Control
                </h3>
                <button
                  type="button"
                  onClick={() => updateCurrent({ x: 50, y: 50 })}
                  className="cursor-pointer text-xs font-medium text-forest hover:underline"
                >
                  Center (50%, 50%)
                </button>
              </div>

              {/* Left / Right / Center / Top / Bottom buttons */}
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {POSITION_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const active =
                    (preset.x !== undefined && Math.round(current.x) === preset.x) ||
                    (preset.y !== undefined && Math.round(current.y) === preset.y);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        updateCurrent({
                          ...(preset.x !== undefined ? { x: preset.x } : {}),
                          ...(preset.y !== undefined ? { y: preset.y } : {}),
                        })
                      }
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[0.7rem] font-medium transition-colors",
                        active
                          ? "border-forest bg-forest/10 text-forest"
                          : "bg-background hover:bg-secondary",
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden />
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* 9-point focal grid + X/Y sliders */}
              <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr]">
                <div
                  role="group"
                  aria-label="9-point position grid"
                  className="grid size-24 grid-cols-3 gap-1 rounded-lg border bg-secondary/40 p-1.5"
                >
                  {NINE_POINT_GRID.map((pt) => {
                    const active =
                      Math.abs(current.x - pt.x) < 6 && Math.abs(current.y - pt.y) < 6;
                    return (
                      <button
                        key={pt.label}
                        type="button"
                        aria-label={pt.label}
                        title={`${pt.label} (${pt.x}%, ${pt.y}%)`}
                        onClick={() => updateCurrent({ x: pt.x, y: pt.y })}
                        className={cn(
                          "flex cursor-pointer items-center justify-center rounded transition-colors",
                          active
                            ? "bg-forest text-primary-foreground"
                            : "bg-background hover:bg-secondary",
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor={`${baseId}-pos-x`} className="font-medium">
                        Horizontal (Left ↔ Right)
                      </label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(current.x)}
                          onChange={(e) =>
                            updateCurrent({ x: Number(e.target.value || 0) })
                          }
                          className="h-6 w-14 px-1.5 text-right text-xs tabular-nums"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                    <input
                      id={`${baseId}-pos-x`}
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={current.x}
                      onChange={(e) => updateCurrent({ x: Number(e.target.value) })}
                      className="h-2 w-full cursor-pointer accent-forest"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor={`${baseId}-pos-y`} className="font-medium">
                        Vertical (Top ↕ Bottom)
                      </label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={Math.round(current.y)}
                          onChange={(e) =>
                            updateCurrent({ y: Number(e.target.value || 0) })
                          }
                          className="h-6 w-14 px-1.5 text-right text-xs tabular-nums"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                    <input
                      id={`${baseId}-pos-y`}
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={current.y}
                      onChange={(e) => updateCurrent({ y: Number(e.target.value) })}
                      className="h-2 w-full cursor-pointer accent-forest"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 border-t bg-card px-6 py-3 sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={resetCurrentDevice}
            >
              <RotateCcw aria-hidden />
              Reset {device === "desktop" ? "Desktop" : "Mobile"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={resetAllDevices}
            >
              Reset All
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Interactive Preview Stage (Drag to reposition, wheel to zoom)              */
/* -------------------------------------------------------------------------- */

function InteractivePreviewStage({
  imageUrl,
  imageAlt,
  settings,
  device,
  portrait,
  imageAspect,
  frameAspect,
  onImageLoad,
  onChange,
}: {
  imageUrl: string;
  imageAlt: string;
  settings: ImageDisplaySettings;
  device: ImageDevice;
  portrait: boolean;
  imageAspect: number;
  frameAspect: number;
  onImageLoad: (w: number, h: number) => void;
  onChange: (patch: Partial<ImageDisplaySettings>) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const fitStyle = imageFitStyle(settings);
  const sensitivity = panSensitivity(settings, imageAspect, frameAspect);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: settings.x,
      startY: settings.y,
    };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame || drag.pointerId !== e.pointerId) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dxPercent = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const dyPercent = ((e.clientY - drag.startClientY) / rect.height) * 100;

    // Sensitivity converts frame-delta into object-position delta; fallback to -1 so dragging
    // still shifts focal point smoothly even when ratio is close to 1.
    const factorX = sensitivity.x !== 0 ? sensitivity.x : -1;
    const factorY = sensitivity.y !== 0 ? sensitivity.y : -1;

    onChange({
      x: drag.startX + dxPercent * factorX,
      y: drag.startY + dyPercent * factorY,
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      setDragging(false);
    }
  };

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        aspectRatio: portrait ? "1 / 1" : String(frameAspect),
        maxWidth: portrait
          ? "14rem"
          : device === "mobile"
            ? "20rem"
            : "100%",
      }}
      className={cn(
        "relative max-h-[22rem] w-full select-none overflow-hidden border bg-secondary shadow-sm",
        portrait ? "rounded-full" : "rounded-xl",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={imageAlt}
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            onImageLoad(img.naturalWidth, img.naturalHeight);
          }
        }}
        style={fitStyle}
        className=" pointer-events-none size-full select-none"
      />

      {/* Rule-of-thirds guide overlay while dragging */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 transition-opacity",
          dragging ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="border-r border-b border-warm-white/40" />
        <div className="border-r border-b border-warm-white/40" />
        <div className="border-b border-warm-white/40" />
        <div className="border-r border-b border-warm-white/40" />
        <div className="border-r border-b border-warm-white/40" />
        <div className="border-b border-warm-white/40" />
        <div className="border-r border-warm-white/40" />
        <div className="border-r border-warm-white/40" />
        <div />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Interactive Crop Stage (Full image + movable / resizable crop rectangle)   */
/* -------------------------------------------------------------------------- */

function InteractiveCropStage({
  imageUrl,
  imageAlt,
  settings,
  imageAspect,
  frameAspect,
  onImageLoad,
  onChange,
}: {
  imageUrl: string;
  imageAlt: string;
  settings: ImageDisplaySettings;
  imageAspect: number;
  frameAspect: number;
  onImageLoad: (w: number, h: number) => void;
  onChange: (patch: Partial<ImageDisplaySettings>) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const crop: CropRect = coverCropRect(settings, imageAspect, frameAspect);

  const interactionRef = useRef<{
    pointerId: number;
    kind: "move" | "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  const startInteraction = (
    e: React.PointerEvent<HTMLElement>,
    kind: "move" | "nw" | "ne" | "sw" | "se",
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    stageRef.current?.setPointerCapture(e.pointerId);
    interactionRef.current = {
      pointerId: e.pointerId,
      kind,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: crop,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const active = interactionRef.current;
    const stage = stageRef.current;
    if (!active || !stage || active.pointerId !== e.pointerId) return;
    const bounds = stage.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const dx = (e.clientX - active.startX) / bounds.width;
    const dy = (e.clientY - active.startY) / bounds.height;
    const sc = active.startCrop;
    const aspectRatioRatio = sc.height > 0 ? sc.width / sc.height : 1;

    if (active.kind === "move") {
      const nextLeft = Math.max(0, Math.min(1 - sc.width, sc.left + dx));
      const nextTop = Math.max(0, Math.min(1 - sc.height, sc.top + dy));
      const nextSettings = settingsFromCropRect(
        { left: nextLeft, top: nextTop, width: sc.width },
        imageAspect,
        frameAspect,
        settings,
      );
      onChange(nextSettings);
      return;
    }

    // Corner resize while preserving the target frame aspect ratio
    const signX = active.kind === "nw" || active.kind === "sw" ? -1 : 1;
    const maxWidth = coverCropRect(
      { ...settings, mode: "cover", zoom: 1 },
      imageAspect,
      frameAspect,
    ).width;
    const minWidth = maxWidth / ZOOM_MAX;

    const nextWidth = Math.max(minWidth, Math.min(maxWidth, sc.width + signX * dx));
    const nextHeight = nextWidth / aspectRatioRatio;

    const anchorRight = sc.left + sc.width;
    const anchorBottom = sc.top + sc.height;

    let nextLeft =
      active.kind === "nw" || active.kind === "sw"
        ? anchorRight - nextWidth
        : sc.left;
    let nextTop =
      active.kind === "nw" || active.kind === "ne"
        ? anchorBottom - nextHeight
        : sc.top;

    nextLeft = Math.max(0, Math.min(1 - nextWidth, nextLeft));
    nextTop = Math.max(0, Math.min(1 - nextHeight, nextTop));

    const nextSettings = settingsFromCropRect(
      { left: nextLeft, top: nextTop, width: nextWidth },
      imageAspect,
      frameAspect,
      settings,
    );
    onChange(nextSettings);
  };

  const endInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
    if (interactionRef.current?.pointerId === e.pointerId) {
      interactionRef.current = null;
    }
  };

  return (
    <div
      ref={stageRef}
      onPointerMove={onPointerMove}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
      style={{ aspectRatio: String(imageAspect) }}
      className="relative max-h-[22rem] w-auto max-w-full select-none overflow-hidden rounded-lg border bg-charcoal shadow-sm"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={imageAlt}
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            onImageLoad(img.naturalWidth, img.naturalHeight);
          }
        }}
        className="pointer-events-none block size-full object-contain opacity-45 select-none"
      />

      {/* Active Crop Window */}
      <div
        onPointerDown={(e) => startInteraction(e, "move")}
        style={{
          left: `${crop.left * 100}%`,
          top: `${crop.top * 100}%`,
          width: `${crop.width * 100}%`,
          height: `${crop.height * 100}%`,
        }}
        className="absolute cursor-move border-2 border-warm-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
      >
        {/* Rule of thirds inside crop box */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
        >
          <div className="border-r border-b border-warm-white/40" />
          <div className="border-r border-b border-warm-white/40" />
          <div className="border-b border-warm-white/40" />
          <div className="border-r border-b border-warm-white/40" />
          <div className="border-r border-b border-warm-white/40" />
          <div className="border-b border-warm-white/40" />
          <div className="border-r border-warm-white/40" />
          <div className="border-r border-warm-white/40" />
          <div />
        </div>

        {/* 4 Corner Handles */}
        {(["nw", "ne", "sw", "se"] as const).map((corner) => (
          <span
            key={corner}
            onPointerDown={(e) => startInteraction(e, corner)}
            className={cn(
              "absolute size-3.5 rounded-xs border border-charcoal bg-warm-white shadow",
              corner === "nw" && "-top-1.5 -left-1.5 cursor-nwse-resize",
              corner === "ne" && "-top-1.5 -right-1.5 cursor-nesw-resize",
              corner === "sw" && "-bottom-1.5 -left-1.5 cursor-nesw-resize",
              corner === "se" && "-right-1.5 -bottom-1.5 cursor-nwse-resize",
            )}
          />
        ))}
      </div>
    </div>
  );
}
