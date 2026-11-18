import { ArrowRight, MessageSquareQuote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";
import { type ProductCardData } from "@/features/products/types";
import { cn } from "@/lib/utils";

import { ImagePlaceholder } from "./image-placeholder";

type ProductCardProps = {
  product: Pick<
    ProductCardData,
    | "slug"
    | "name"
    | "shortDescription"
    | "category"
    | "material"
    | "image"
    | "isCustomizable"
  > &
    Partial<Pick<ProductCardData, "isFeatured">>;
  /** Set for above-the-fold cards to load the image eagerly. */
  priority?: boolean;
  className?: string;
};

/**
 * Catalog product card: large 4:5 photo, category, name, material, short description,
 * and two actions — View Details (secondary) and Request a Quote (primary).
 */
export function ProductCard({ product, priority = false, className }: ProductCardProps) {
  const href = routes.product(product.slug);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border border-transparent bg-card transition-colors duration-300 hover:border-border",
        className,
      )}
    >
      <Link
        href={href}
        className="relative block aspect-[4/5] overflow-hidden bg-secondary"
        tabIndex={-1}
        aria-hidden
      >
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <ImagePlaceholder subject={product.name} />
        )}
        {product.isFeatured || product.isCustomizable ? (
          <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.isFeatured ? (
              <span className="rounded-full bg-warm-white/90 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-jute-deep">
                Featured
              </span>
            ) : null}
            {product.isCustomizable ? (
              <span className="rounded-full bg-warm-white/90 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-forest">
                Customisable
              </span>
            ) : null}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <p className="line-clamp-1 text-[0.65rem] font-semibold tracking-[0.12em] text-jute-deep uppercase sm:text-[0.7rem] sm:tracking-[0.16em]">
          {product.category.name}
        </p>
        <h3 className="mt-1.5 text-base leading-snug sm:text-lg">
          <Link href={href} className="transition-colors hover:text-forest">
            {product.name}
          </Link>
        </h3>
        {product.material ? (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="sr-only">Material: </span>
            {product.material}
          </p>
        ) : null}
        {product.shortDescription ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/80">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-4 sm:pt-5">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="w-full px-2 text-xs sm:text-sm"
          >
            <Link href={href}>
              View Details <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="sm" className="w-full px-2 text-xs sm:text-sm">
            <Link href={routes.requestQuoteFor(product.slug)}>
              <MessageSquareQuote aria-hidden /> Request a Quote
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
