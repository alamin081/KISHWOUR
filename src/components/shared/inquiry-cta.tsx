import { ArrowRight, MessageSquareQuote } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

type InquiryCtaProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  /** "band": full-width forest section. "card": contained beige panel. */
  variant?: "band" | "card";
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string } | null;
  className?: string;
};

/** Call-to-action for wholesale / export / OEM inquiries. */
export function InquiryCta({
  eyebrow = "Wholesale & export",
  title = "Sourcing handmade products from Bangladesh?",
  description = "Tell us what you need — product, quantity and destination — and we will prepare a quotation for your business.",
  variant = "band",
  primary = { label: "Request a Quote", href: routes.requestQuote },
  secondary = { label: "Custom manufacturing", href: routes.customManufacturing },
  className,
}: InquiryCtaProps) {
  const band = variant === "band";

  return (
    <section
      className={cn(
        band ? "bg-forest text-warm-white" : "rounded-xl bg-secondary text-charcoal",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-8 md:flex-row md:items-center md:justify-between",
          band ? "container-page py-14 sm:py-20" : "p-8 sm:p-12",
        )}
      >
        <div className="max-w-2xl">
          <p
            className={cn(
              "mb-3 text-xs font-semibold tracking-[0.2em] uppercase",
              band ? "text-beige" : "text-jute-deep",
            )}
          >
            {eyebrow}
          </p>
          <h2
            className={cn("text-2xl sm:text-3xl lg:text-4xl", band && "text-warm-white")}
          >
            {title}
          </h2>
          <p
            className={cn(
              "mt-4 leading-relaxed",
              band ? "text-warm-white/85" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className={cn(band && "bg-warm-white text-forest hover:bg-beige")}
          >
            <Link href={primary.href}>
              <MessageSquareQuote aria-hidden /> {primary.label}
            </Link>
          </Button>
          {secondary ? (
            <Button
              asChild
              size="lg"
              variant="secondary"
              className={cn(
                band &&
                  "border-warm-white/70 text-warm-white hover:bg-warm-white hover:text-forest",
              )}
            >
              <Link href={secondary.href}>
                {secondary.label} <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
