import { Skeleton } from "@/components/ui/skeleton";

/**
 * Suspense boundary for every admin page.
 *
 * Admin pages read the session and the database at request time, which cannot be
 * prerendered. This file gives the whole panel segment a boundary, so the layout chrome
 * is served from the static shell and each page streams in behind this skeleton instead
 * of blocking the route (see the Cache Components guides on streaming and authentication).
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy>
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div aria-hidden>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" aria-hidden />
    </div>
  );
}
