import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { MediaSlot, type MediaSlotImage } from "./media-slot";

type EditorialSectionProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  body: readonly string[] | string;
  /**
   * Show a photo slot beside the text (placeholder until a photo is configured).
   * Structural on purpose: accepts `ContentImage` and stored page images alike.
   */
  media?: { image?: MediaSlotImage; label: string };
  reverse?: boolean;
  tone?: "default" | "muted";
  children?: ReactNode;
};

/** Text section with optional photo, used on About, Our Craft and Sustainability. */
export function EditorialSection({
  id,
  eyebrow,
  title,
  body,
  media,
  reverse = false,
  tone = "default",
  children,
}: EditorialSectionProps) {
  const paragraphs = typeof body === "string" ? [body] : body;
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-28 py-14 sm:py-20", tone === "muted" && "bg-secondary/40")}
    >
      <div
        className={cn(
          "container-page grid gap-10 lg:gap-16",
          media ? "items-center lg:grid-cols-2" : "lg:grid-cols-[1fr_1.6fr]",
        )}
      >
        <div className={cn(media && reverse && "lg:order-2")}>
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-jute-deep uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h2 id={headingId} className="text-3xl sm:text-4xl">
            {title}
          </h2>
          {media ? (
            <div className="mt-5 space-y-4">
              {paragraphs.map((p) => (
                <p key={p} className="leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              {children}
            </div>
          ) : null}
        </div>
        {media ? (
          <MediaSlot image={media.image} label={media.label} className="aspect-[4/3]" />
        ) : (
          <div className="space-y-4 lg:pt-1">
            {paragraphs.map((p) => (
              <p key={p} className="text-lg leading-relaxed text-foreground/85">
                {p}
              </p>
            ))}
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
