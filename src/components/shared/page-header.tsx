import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string | null;
  children?: ReactNode;
  className?: string;
};

/** Standard page title block used at the top of storefront pages. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("border-b border-border bg-secondary/40", className)}>
      <div className="container-page py-10 sm:py-14">
        {children}
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-jute-deep uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl text-charcoal sm:text-4xl lg:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
