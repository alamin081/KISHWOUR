"use client";

import { ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { type ImageDevice, type ImageFrameAspects } from "@/features/homepage/image-display";
import { type HomepageImage } from "@/features/homepage/schema";
import { type PageSectionInfo } from "@/features/pages/registry";
import { cn } from "@/lib/utils";

import { SectionImageField } from "./image-field";

/**
 * Right-hand edit panel, shared by every page editor. A static column on large screens,
 * an overlay on small ones. The fields themselves come from the page's adapter, so this
 * file only owns the chrome: heading, image control, links and the footer note.
 */
export function SectionPanel({
  meta,
  image,
  imageLabel,
  imageError,
  imagePortrait = false,
  imageAspects,
  activeDevice = "desktop",
  cloudinaryConfigured,
  imagePickerRef,
  imageEditorRef,
  onChangeImage,
  onCommitImage,
  onClose,
  children,
}: {
  meta: PageSectionInfo;
  image: HomepageImage | null;
  imageLabel: string;
  imageError?: string;
  imagePortrait?: boolean;
  imageAspects?: ImageFrameAspects;
  activeDevice?: ImageDevice;
  cloudinaryConfigured: boolean;
  imagePickerRef: React.RefObject<(() => void) | null>;
  imageEditorRef?: React.RefObject<(() => void) | null>;
  onChangeImage: (image: HomepageImage | null) => void;
  onCommitImage?: (image: HomepageImage | null) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, [meta.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close the edit panel"
        onClick={onClose}
        className="fixed inset-0 z-40 cursor-default bg-charcoal/30 lg:hidden"
      />
      <aside
        aria-label={`Edit the ${meta.label} section`}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l bg-background shadow-xl",
          "lg:static lg:z-auto lg:w-[22rem] lg:max-w-none lg:shadow-none",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <h2
              ref={heading}
              tabIndex={-1}
              className="font-sans text-base font-semibold outline-none"
            >
              {meta.label}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{meta.hint}</p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Close the edit panel"
            onClick={onClose}
          >
            <X aria-hidden />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          {meta.manageLinks?.length ? (
            <div className="space-y-2 rounded-lg border bg-secondary/40 p-3">
              {meta.manageLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 text-sm font-medium text-forest underline-offset-4 hover:underline"
                >
                  <ExternalLink className="size-4" aria-hidden /> {link.label}
                </Link>
              ))}
            </div>
          ) : null}

          {meta.hasImageSlot ? (
            <div className="space-y-2">
              <h3 className="font-sans text-sm font-semibold">Section image</h3>
              <SectionImageField
                value={image}
                label={imageLabel}
                cloudinaryConfigured={cloudinaryConfigured}
                {...(imageError ? { error: imageError } : {})}
                {...(imagePortrait ? { variant: "portrait" as const } : {})}
                {...(imageAspects ? { defaultAspects: imageAspects } : {})}
                activeDevice={activeDevice}
                pickerRef={imagePickerRef}
                {...(imageEditorRef ? { editorRef: imageEditorRef } : {})}
                onChange={onChangeImage}
                {...(onCommitImage ? { onCommit: onCommitImage } : {})}
              />
            </div>
          ) : null}

          {children}
        </div>

        <p className="border-t p-4 text-xs text-muted-foreground">
          Changes stay in the draft. Use <strong>Save draft</strong> to keep them and{" "}
          <strong>Publish</strong> to put them on the website.
        </p>
      </aside>
    </>
  );
}
