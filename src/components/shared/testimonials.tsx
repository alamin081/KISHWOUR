import { Quote } from "lucide-react";
import Image from "next/image";
import { type CSSProperties } from "react";

import {
  imageDisplayCssVars,
  isDefaultImageDisplay,
  resolveImageDisplay,
} from "@/features/homepage/image-display";
import { type HomepageTestimonial } from "@/features/homepage/schema";
import { countryName } from "@/lib/data/countries";

import { RESPONSIVE_IMAGE_DISPLAY_CLASS } from "./media-slot";
import { SectionHeading } from "./section-heading";

/** "Purchasing Manager, Acme Ltd · Germany" - only the parts that were filled in. */
function attribution(testimonial: HomepageTestimonial): string {
  const role = [testimonial.role, testimonial.company].filter(Boolean).join(", ");
  const country = countryName(testimonial.country);
  return [role, country].filter(Boolean).join(" · ");
}

function TestimonialAvatar({
  photo,
}: {
  photo: NonNullable<HomepageTestimonial["photo"]>;
}) {
  const display = resolveImageDisplay(photo.display);
  const custom = !isDefaultImageDisplay(display);
  const style = custom ? (imageDisplayCssVars(display) as CSSProperties) : undefined;
  return (
    <span
      style={style}
      className="relative size-11 shrink-0 overflow-hidden rounded-full bg-secondary"
    >
      <Image
        src={photo.url}
        alt={photo.alt}
        fill
        sizes="88px"
        className={custom ? RESPONSIVE_IMAGE_DISPLAY_CLASS : "object-cover"}
      />
    </span>
  );
}

/** Renders only real, approved testimonials. Returns nothing when the list is empty. */
export function Testimonials({
  eyebrow,
  title,
  items,
}: {
  eyebrow?: string;
  title: string;
  items: readonly HomepageTestimonial[];
}) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="bg-secondary/50 py-16 sm:py-24"
    >
      <div className="container-page">
        <h2 id="testimonials-heading" className="sr-only">
          Testimonials
        </h2>
        <SectionHeading eyebrow={eyebrow || undefined} title={title} align="center" />
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((testimonial) => {
            const meta = attribution(testimonial);
            return (
              <li key={testimonial.id}>
                <figure className="flex h-full flex-col rounded-lg bg-card p-6">
                  <Quote className="size-6 text-jute" aria-hidden />
                  <blockquote className="mt-4 flex-1 font-serif text-lg leading-relaxed">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 text-sm">
                    {testimonial.photo ? (
                      <TestimonialAvatar photo={testimonial.photo} />
                    ) : null}
                    <span>
                      <span className="font-semibold">{testimonial.name}</span>
                      {meta ? (
                        <span className="block text-muted-foreground">{meta}</span>
                      ) : null}
                    </span>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
