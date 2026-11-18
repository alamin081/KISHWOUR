import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Builds the href for a page number (keeps other query params). */
  hrefFor: (page: number) => string;
};

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  const item =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm transition-colors";

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(item, "hover:bg-secondary")}
          rel="prev"
        >
          <ChevronLeft className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
        </Link>
      ) : null}
      {pages.map((p, i) => {
        const gap = i > 0 && p - (pages[i - 1] ?? p) > 1;
        return (
          <span key={p} className="flex items-center gap-2">
            {gap ? <span className="px-1 text-muted-foreground">…</span> : null}
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                item,
                p === page
                  ? "border-forest bg-forest text-primary-foreground"
                  : "hover:bg-secondary",
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < totalPages ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(item, "hover:bg-secondary")}
          rel="next"
        >
          <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}
