"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ImagePlus,
  Pencil,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import { type PageSectionInfo } from "@/features/pages/registry";
import { cn } from "@/lib/utils";

type Props = {
  meta: PageSectionInfo;
  visible: boolean;
  active: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** False when Cloudinary is not configured: the image buttons stay disabled. */
  canUpload: boolean;
  onEdit: () => void;
  onReplaceImage: () => void;
  onEditImage?: () => void;
  onDeleteImage: () => void;
  onToggleVisible: () => void;
  onMove: (direction: -1 | 1) => void;
  children: React.ReactNode;
};

function ControlButton({
  label,
  onClick,
  disabled,
  tone,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-charcoal/15 bg-warm-white text-charcoal transition-colors outline-none hover:bg-forest hover:text-warm-white focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4",
        tone === "danger" && "hover:bg-destructive",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Wraps one section of any page in the editor preview: a hover/focus toolbar with its
 * controls, a "hidden" badge for sections that are switched off, and a highlight for the
 * section whose edit panel is open. Links inside the preview are neutralised by the editor.
 */
export function SectionFrame({
  meta,
  visible,
  active,
  isFirst,
  isLast,
  canUpload,
  onEdit,
  onReplaceImage,
  onEditImage,
  onDeleteImage,
  onToggleVisible,
  onMove,
  children,
}: Props) {
  return (
    <section
      aria-label={`${meta.label} section`}
      className={cn(
        "group/section relative scroll-mt-4 outline-2 -outline-offset-2 outline-transparent transition-[outline-color]",
        "focus-within:outline-forest/40 hover:outline-forest/40",
        active && "outline-forest",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 p-3",
          "opacity-0 transition-opacity group-focus-within/section:opacity-100 group-hover/section:opacity-100",
        )}
      >
        <span className="pointer-events-auto rounded-md bg-charcoal/90 px-2 py-1 text-[0.7rem] font-semibold tracking-wide text-warm-white uppercase">
          {meta.label}
          {visible ? "" : " · hidden"}
        </span>
        <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-lg bg-warm-white/95 p-1 shadow-sm ring-1 ring-charcoal/10">
          {meta.editable ? (
            <ControlButton label={`Edit ${meta.label}`} onClick={onEdit}>
              <Pencil />
            </ControlButton>
          ) : null}
          {meta.hasImageSlot ? (
            <>
              <ControlButton
                label={
                  canUpload
                    ? `${meta.hasImage ? "Replace" : "Upload"} the ${meta.label} image`
                    : "Image upload is not configured"
                }
                disabled={!canUpload}
                onClick={onReplaceImage}
              >
                <ImagePlus />
              </ControlButton>
              {onEditImage ? (
                <ControlButton
                  label={`Edit the ${meta.label} image (crop, zoom & position)`}
                  disabled={!meta.hasImage}
                  onClick={onEditImage}
                >
                  <SlidersHorizontal />
                </ControlButton>
              ) : null}
              <ControlButton
                label={`Delete the ${meta.label} image`}
                disabled={!meta.hasImage}
                tone="danger"
                onClick={onDeleteImage}
              >
                <Trash2 />
              </ControlButton>
            </>
          ) : null}
          <ControlButton
            label={visible ? `Hide ${meta.label}` : `Show ${meta.label}`}
            onClick={onToggleVisible}
          >
            {visible ? <Eye /> : <EyeOff />}
          </ControlButton>
          <ControlButton
            label={`Move ${meta.label} up`}
            disabled={isFirst}
            onClick={() => onMove(-1)}
          >
            <ArrowUp />
          </ControlButton>
          <ControlButton
            label={`Move ${meta.label} down`}
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            <ArrowDown />
          </ControlButton>
        </div>
      </div>

      <div
        className={cn(
          !visible && "opacity-45 saturate-50",
          "transition-[opacity,filter]",
        )}
      >
        {children}
      </div>
    </section>
  );
}
