import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg bg-card", className)} aria-hidden>
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-3 p-3 sm:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <div className="flex flex-col gap-2 pt-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("overflow-hidden rounded-lg border bg-card", className)}
      aria-hidden
    >
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2 p-5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/** Responsive grid of skeletons with an accessible loading announcement. */
export function CardGridSkeleton({
  count = 8,
  variant = "product",
}: {
  count?: number;
  variant?: "product" | "category";
}) {
  const Item = variant === "product" ? ProductCardSkeleton : CategoryCardSkeleton;
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div
        className={cn(
          "grid gap-4 sm:gap-6",
          variant === "product"
            ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {Array.from({ length: count }, (_, i) => (
          <Item key={i} />
        ))}
      </div>
    </div>
  );
}

/** Catalogue page skeleton: filter sidebar + toolbar + product grid. */
export function CatalogSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr] xl:gap-14">
      <div className="hidden space-y-3 lg:block" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div>
        <div className="flex justify-between gap-4 border-b pb-5" aria-hidden>
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="mt-10">
          <CardGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
