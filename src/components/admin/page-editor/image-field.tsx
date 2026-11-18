"use client";

import { ImagePlus, Loader2, SlidersHorizontal, Trash2 } from "lucide-react";
import Image from "next/image";
import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Field } from "@/components/admin/form-fields";
import { RESPONSIVE_IMAGE_DISPLAY_CLASS } from "@/components/shared/media-slot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACCEPTED_IMAGE_TYPES,
  uploadToCloudinary,
  validateImageFile,
} from "@/features/admin/cloudinary-upload";
import { getUploadSignature } from "@/features/admin/upload-actions";
import {
  type ImageDevice,
  type ImageDisplay,
  type ImageFrameAspects,
  imageDisplayCssVars,
  isDefaultImageDisplay,
  resolveImageDisplay,
} from "@/features/homepage/image-display";
import { homepageImageSchema, type HomepageImage } from "@/features/homepage/schema";
import { trackPageUpload } from "@/features/pages/actions";
import { cn } from "@/lib/utils";

import { ImageEditorDialog } from "./image-editor-dialog";

type Props = {
  value: HomepageImage | null;
  onChange: (image: HomepageImage | null) => void;
  /**
   * Optional callback invoked on discrete image mutations (upload, edit display, remove)
   * so the parent editor can persist the updated draft to the database immediately.
   */
  onCommit?: (image: HomepageImage | null) => void;
  /** False when CLOUDINARY_* is not configured: the upload buttons are disabled. */
  cloudinaryConfigured: boolean;
  /** Describes the photo that belongs here, e.g. "Lifestyle photography". */
  label: string;
  /** Server-side validation message for this image, e.g. a missing alt text. */
  error?: string;
  /** Lets the hover overlay open the file picker from outside the panel. */
  pickerRef?: React.RefObject<(() => void) | null>;
  /** Lets the hover overlay open the Edit Image modal from outside the panel. */
  editorRef?: React.RefObject<(() => void) | null>;
  /** "portrait" is the compact, round variant used for testimonial photos. */
  variant?: "section" | "portrait";
  /** Natural container aspect ratios per device for this section. */
  defaultAspects?: ImageFrameAspects;
  /** Current preview device in the editor toolbar, so the modal opens on that tab. */
  activeDevice?: ImageDevice;
};

const NOT_CONFIGURED =
  "Image upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to enable uploads.";

/**
 * Generates a meaningful default alt text when an admin uploads a new photo so that
 * saving or publishing is never blocked by an empty `alt` field.
 */
function defaultAltFrom(file: File, fallbackLabel: string): string {
  const cleanFallback = fallbackLabel.trim() || "Kishwour handmade product photography";
  const stem = file.name
    .replace(/\.[a-z0-9]{1,6}$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (
    !stem ||
    stem.length < 3 ||
    /^(img|dsc|image|photo|pic|screenshot|whatsapp|untitled|download|file)[\s\d_-]*$/i.test(
      stem,
    )
  ) {
    return cleanFallback.slice(0, 180);
  }
  return stem.slice(0, 180);
}

/**
 * Appends a cache-busting `?v=<timestamp>` to a Cloudinary URL so the browser
 * and `next/image` always fetch the latest version after a replace.
 */
function cacheBustedUrl(url: string, version: number): string {
  if (version === 0) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("v", String(version));
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Upload / replace / edit / remove the editorial image of one page section. Every change
 * edits the draft only; the previous Cloudinary asset is removed after publishing.
 */
export function SectionImageField({
  value,
  onChange,
  onCommit,
  cloudinaryConfigured,
  label,
  error,
  pickerRef,
  editorRef,
  variant = "section",
  defaultAspects,
  activeDevice = "desktop",
}: Props) {
  const portrait = variant === "portrait";
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  // Incremented on every successful upload to force Next/Image to re-fetch the new URL
  // even when the browser has the previous one cached (same filename, different content).
  const [previewKey, setPreviewKey] = useState(0);
  const altId = useId();

  // Lets the hover overlay's "Replace image" button open this picker.
  useEffect(() => {
    if (!pickerRef) return;
    pickerRef.current = () => input.current?.click();
    return () => {
      pickerRef.current = null;
    };
  }, [pickerRef]);

  // Lets the hover overlay's "Edit image" button open the image editor dialog.
  useEffect(() => {
    if (!editorRef) return;
    editorRef.current = () => {
      if (value) setEditorOpen(true);
    };
    return () => {
      editorRef.current = null;
    };
  }, [editorRef, value]);

  const altIssue =
    value && !homepageImageSchema.safeParse(value).success
      ? "Alt text is required so screen readers can describe the photo."
      : undefined;

  async function upload(file: File) {
    const invalid = validateImageFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setUploading(true);
    try {
      const signature = await getUploadSignature("site");
      if (!signature.ok) {
        toast.error(signature.message);
        return;
      }
      const uploaded = await uploadToCloudinary(file, signature);
      const existingAlt = value?.alt?.trim();
      const nextImage: HomepageImage = {
        url: uploaded.url,
        publicId: uploaded.publicId,
        alt: existingAlt && existingAlt.length > 0 ? existingAlt : defaultAltFrom(file, label),
        ...(value?.display ? { display: value.display } : {}),
      };
      onChange(nextImage);
      onCommit?.(nextImage);
      // Force the preview image to remount so the browser fetches the new URL
      // instead of showing the cached version of the previous photo.
      setPreviewKey(Date.now());
      // Recorded so the asset can be cleaned up even if it never reaches a saved draft.
      if (uploaded.publicId) {
        const tracked = await trackPageUpload(uploaded.publicId);
        if (!tracked.ok) console.error("[pages] upload not tracked:", tracked.message);
      }
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error ? uploadError.message : "The upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  const handleSaveDisplay = (nextDisplay: ImageDisplay) => {
    if (!value) return;
    const nextImage: HomepageImage = {
      ...value,
      alt: value.alt.trim() || label || "Kishwour photography",
      display: nextDisplay,
    };
    onChange(nextImage);
    onCommit?.(nextImage);
  };

  const handleRemove = () => {
    onChange(null);
    onCommit?.(null);
  };

  const resolvedDisplay = resolveImageDisplay(value?.display);
  const hasCustomDisplay = Boolean(value && !isDefaultImageDisplay(resolvedDisplay));
  const thumbVars = hasCustomDisplay
    ? (imageDisplayCssVars(resolvedDisplay) as CSSProperties)
    : undefined;

  return (
    <div className="space-y-3">
      {value ? (
        <div
          className={cn(
            "overflow-hidden border bg-background",
            portrait ? "size-20 rounded-full" : "rounded-lg",
          )}
        >
          <div
            style={thumbVars}
            className={cn(
              "relative overflow-hidden bg-secondary",
              portrait ? "size-full" : "aspect-[4/3]",
            )}
          >
            <Image
              key={previewKey}
              src={cacheBustedUrl(value.url, previewKey)}
              alt={value.alt || label}
              fill
              sizes={portrait ? "80px" : "360px"}
              className={
                hasCustomDisplay ? RESPONSIVE_IMAGE_DISPLAY_CLASS : "object-cover"
              }
              unoptimized
            />
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed bg-secondary/40 px-4 py-3 text-center text-sm text-muted-foreground">
          {portrait
            ? "No photo. The testimonial is shown without one."
            : `No photo yet. The homepage shows a “${label} coming soon” placeholder.`}
        </p>
      )}

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading || !cloudinaryConfigured}
          aria-describedby={cloudinaryConfigured ? undefined : `${altId}-disabled`}
          onClick={() => input.current?.click()}
        >
          {uploading ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <ImagePlus aria-hidden />
          )}
          {uploading
            ? "Uploading…"
            : value
              ? portrait
                ? "Replace photo"
                : "Replace image"
              : portrait
                ? "Add photo"
                : "Upload image"}
        </Button>

        {value ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={uploading}
              onClick={() => setEditorOpen(true)}
            >
              <SlidersHorizontal aria-hidden /> Edit image
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-destructive"
              disabled={uploading}
              onClick={handleRemove}
            >
              <Trash2 aria-hidden /> {portrait ? "Remove photo" : "Remove image"}
            </Button>
          </>
        ) : null}
      </div>

      {value && editorOpen ? (
        <ImageEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          image={value}
          label={label}
          portrait={portrait}
          {...(defaultAspects ? { defaultAspects } : {})}
          initialDevice={activeDevice}
          onSave={handleSaveDisplay}
        />
      ) : null}

      {cloudinaryConfigured ? (
        portrait ? null : (
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP or AVIF up to 10 MB. Use <strong>Edit image</strong> to adjust
            crop, zoom, fit mode and position for Desktop and Mobile.
          </p>
        )
      ) : (
        <p id={`${altId}-disabled`} className="text-xs text-destructive">
          {NOT_CONFIGURED}
        </p>
      )}

      {value ? (
        <Field
          id={altId}
          label="Alt text"
          required
          error={error ?? altIssue}
          hint="Describe the photo in a few words, for screen readers and search engines."
        >
          <Input
            id={altId}
            value={value.alt}
            aria-invalid={Boolean(error ?? altIssue)}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            onBlur={() => {
              if (!value.alt.trim()) {
                const filled = {
                  ...value,
                  alt: label.trim() || "Kishwour handmade product photography",
                };
                onChange(filled);
                onCommit?.(filled);
              }
            }}
          />
        </Field>
      ) : null}
    </div>
  );
}
