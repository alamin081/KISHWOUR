import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

/**
 * Kishwour button system
 * - default (Primary):   Forest Green fill — the main action on a view (e.g. Request a Quote)
 * - secondary:           Charcoal outline on transparent — supporting action (e.g. View Details)
 * - outline:             Neutral bordered button on light surfaces
 * - jute:                Jute accent fill, for rare highlight actions (e.g. Alibaba Store)
 * - ghost / link:        Low-emphasis actions
 * Interactions are deliberately subtle: colour shifts only, no movement.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium tracking-wide whitespace-nowrap transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-forest-deep",
        secondary:
          "border border-charcoal/80 bg-transparent text-charcoal hover:bg-charcoal hover:text-warm-white",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        jute: "bg-jute-deep text-warm-white hover:brightness-90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 has-[>svg]:px-4",
        xs: "h-7 gap-1 px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 px-7 text-base has-[>svg]:px-6",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
