import { type LucideIcon, PackageOpen } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  /** Heading element; use "h1" when the empty state is the whole page (e.g. 404). */
  headingAs?: "h1" | "h2" | "h3";
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = PackageOpen,
  action,
  headingAs: Heading = "h3",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-forest">
        <Icon className="size-6" aria-hidden />
      </span>
      <Heading className="text-xl">{title}</Heading>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
