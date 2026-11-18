import { Camera } from "lucide-react";

import { cn } from "@/lib/utils";

type ImagePlaceholderProps = {
  /** What the missing photo is of — announced to screen readers. */
  subject: string;
  className?: string;
  compact?: boolean;
};

/**
 * Clearly-marked temporary placeholder shown until real product photography is supplied.
 * Deliberately not a stock or generated image, so it can never be mistaken for a product.
 */
export function ImagePlaceholder({
  subject,
  className,
  compact = false,
}: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`Photo of ${subject} coming soon`}
      className={cn(
        "relative flex size-full flex-col items-center justify-center gap-2 overflow-hidden bg-secondary text-jute-deep",
        "bg-[repeating-linear-gradient(45deg,transparent_0_10px,rgb(166_110_67/0.07)_10px_11px)]",
        className,
      )}
    >
      <Camera className={compact ? "size-5" : "size-7"} aria-hidden strokeWidth={1.5} />
      {!compact ? (
        <span className="px-2 text-center text-[0.65rem] font-semibold tracking-[0.12em] uppercase sm:text-[0.7rem] sm:tracking-[0.18em]">
          Photo coming soon
        </span>
      ) : null}
    </div>
  );
}
