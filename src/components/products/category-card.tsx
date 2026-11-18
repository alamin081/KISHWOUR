import {
  ArrowUpRight,
  Footprints,
  Lamp,
  Leaf,
  type LucideIcon,
  Package,
  Palette,
  ShoppingBag,
  Sprout,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

/** Decorative icon per launch category (used only when no category photo exists). */
const categoryIcons: Record<string, LucideIcon> = {
  footwear: Footprints,
  "jute-products": Leaf,
  "handmade-bags": ShoppingBag,
  handicrafts: Palette,
  "home-decor": Lamp,
  "natural-fiber": Sprout,
};

type CategoryCardProps = {
  category: {
    name: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    productCount?: number;
  };
  className?: string;
};

export function CategoryCard({ category, className }: CategoryCardProps) {
  const Icon = categoryIcons[category.slug] ?? Package;

  return (
    <Link
      href={routes.category(category.slug)}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        {category.image ? (
          <Image
            src={category.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 bg-[repeating-linear-gradient(45deg,transparent_0_10px,rgb(166_110_67/0.07)_10px_11px)]">
            <span className="flex size-16 items-center justify-center rounded-full bg-warm-white text-forest">
              <Icon className="size-7" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="text-[0.65rem] font-semibold tracking-[0.18em] text-jute-deep uppercase">
              Photo coming soon
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 items-start justify-between gap-4 p-5">
        <div>
          <h3 className="text-lg leading-snug transition-colors group-hover:text-forest">
            {category.name}
          </h3>
          {category.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {category.description}
            </p>
          ) : null}
          {typeof category.productCount === "number" ? (
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {category.productCount === 1
                ? "1 product"
                : `${category.productCount} products`}
            </p>
          ) : null}
        </div>
        <ArrowUpRight
          className="mt-1 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-forest"
          aria-hidden
        />
      </div>
    </Link>
  );
}
