import { type ReactNode, Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Suspense boundary for an admin page.
 *
 * Admin pages read the session and the database at request time, which cannot be
 * prerendered. Wrapping the page body here keeps the route's static shell renderable and
 * streams the real content in behind a skeleton, as the Cache Components guides describe.
 * The `requireStaff` guard moves inside the boundary with the data it protects, so
 * authorization is unchanged - it simply runs where the data is read.
 */
export function AdminBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={<AdminBodySkeleton />}>{children}</Suspense>;
}

export function AdminBodySkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div aria-hidden>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <Skeleton className="h-96 rounded-xl" aria-hidden />
    </div>
  );
}
