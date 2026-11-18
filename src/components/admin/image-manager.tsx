"use client";

import { ArrowDown, ArrowUp, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACCEPTED_IMAGE_TYPES,
  uploadToCloudinary,
  validateImageFile,
} from "@/features/admin/cloudinary-upload";
import { getUploadSignature } from "@/features/admin/upload-actions";
import { type UploadKind } from "@/features/admin/upload-kinds";

export type ManagedImage = {
  imageUrl: string;
  publicId?: string | null;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

type Props = {
  value: ManagedImage[];
  onChange: (images: ManagedImage[]) => void;
  kind: UploadKind;
  multiple?: boolean;
  max?: number;
};

/**
 * Uploads directly from the browser to Cloudinary with a server-signed request.
 * First image = primary. Shows a clear message when Cloudinary is not configured.
 */
export function ImageManager({
  value,
  onChange,
  kind,
  multiple = true,
  max = 12,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  async function upload(files: FileList) {
    const list = [...files].slice(0, Math.max(0, max - value.length));
    if (list.length === 0) return;
    const sig = await getUploadSignature(kind);
    if (!sig.ok) {
      toast.error(sig.message);
      return;
    }
    setUploading(list.length);
    const added: ManagedImage[] = [];
    for (const file of list) {
      const invalid = validateImageFile(file);
      if (invalid) {
        toast.error(invalid);
        setUploading((n) => n - 1);
        continue;
      }
      try {
        const uploaded = await uploadToCloudinary(file, sig);
        added.push({
          imageUrl: uploaded.url,
          publicId: uploaded.publicId || null,
          width: uploaded.width,
          height: uploaded.height,
          altText: null,
        });
      } catch (error) {
        toast.error(
          `${file.name}: ${error instanceof Error ? error.message : "upload failed"}`,
        );
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (added.length) {
      onChange(multiple ? [...value, ...added] : added.slice(0, 1));
      toast.success(`${added.length} image${added.length > 1 ? "s" : ""} uploaded.`);
    }
  }

  const move = (from: number, to: number) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3 sm:col-span-2">
      {value.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((img, i) => (
            <li
              key={img.imageUrl}
              className="overflow-hidden rounded-lg border bg-background"
            >
              <div className="relative aspect-[4/3] bg-secondary">
                <Image
                  src={img.imageUrl}
                  alt={img.altText ?? ""}
                  fill
                  sizes="300px"
                  className="object-cover"
                />
                {i === 0 && multiple ? (
                  <span className="absolute top-2 left-2 rounded-full bg-forest px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                    Primary
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-2">
                <Input
                  aria-label={`Alt text for image ${i + 1}`}
                  placeholder="Alt text (describe the photo)"
                  value={img.altText ?? ""}
                  onChange={(e) =>
                    onChange(
                      value.map((v, j) =>
                        j === i ? { ...v, altText: e.target.value } : v,
                      ),
                    )
                  }
                  className="h-8 text-xs"
                />
                <div className="flex gap-1">
                  {multiple ? (
                    <>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="outline"
                        aria-label="Set as primary image"
                        disabled={i === 0}
                        onClick={() => move(i, 0)}
                      >
                        <Star />
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="outline"
                        aria-label="Move earlier"
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="outline"
                        aria-label="Move later"
                        disabled={i === value.length - 1}
                        onClick={() => move(i, i + 1)}
                      >
                        <ArrowDown />
                      </Button>
                    </>
                  ) : null}
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="outline"
                    className="ml-auto text-destructive"
                    aria-label="Remove image"
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void upload(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={uploading > 0 || value.length >= max}
        onClick={() => input.current?.click()}
      >
        {uploading > 0 ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <ImagePlus aria-hidden />
        )}
        {uploading > 0
          ? `Uploading ${uploading}…`
          : multiple
            ? "Upload images"
            : value.length
              ? "Replace image"
              : "Upload image"}
      </Button>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP or AVIF up to 10 MB
        {multiple
          ? `, max ${max} images. The first image is the primary image.`
          : "."}{" "}
        Images are stored in Cloudinary.
      </p>
    </div>
  );
}
