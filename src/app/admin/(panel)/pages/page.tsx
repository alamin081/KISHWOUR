import { CircleCheck, CircleDot, ExternalLink, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminPageHeader, formatDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EDITABLE_PAGES } from "@/features/pages/ids";
import { getPagesOverview, type PageOverview } from "@/features/pages/queries";
import { PAGE_PERMISSION } from "@/features/pages/permission";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Pages" };

function StatusPill({ page }: { page: PageOverview }) {
  if (page.draftDiffers) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-jute/10 px-2.5 py-0.5 text-xs font-semibold text-jute-deep">
        <CircleDot className="size-3" aria-hidden /> Draft differs from live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">
      <CircleCheck className="size-3" aria-hidden /> Live
    </span>
  );
}

async function PageList() {
  // The guard lives inside the boundary with the data it protects, so the page shell can
  // still be prerendered. The layout and every Server Action re-check it too.
  await requireStaff(PAGE_PERMISSION);
  const overview = await getPagesOverview();
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {overview.map((page) => {
        const meta = EDITABLE_PAGES[page.pageId];
        return (
          <li
            key={page.pageId}
            className="flex flex-col rounded-xl border bg-card p-5 transition-colors hover:border-forest/40"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-sans text-base font-semibold">{meta.label}</h2>
              <StatusPill page={page} />
            </div>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
              {meta.description}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {page.hasPublished
                ? `Published ${formatDate(page.publishedAt)}${
                    page.publishedBy ? ` by ${page.publishedBy}` : ""
                  }`
                : "Never published — the website shows the default content"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`/admin/pages/${page.pageId}`}>
                  <PencilLine aria-hidden /> Edit
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={meta.path} target="_blank" rel="noopener">
                  <ExternalLink aria-hidden /> View
                </a>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PageListSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="rounded-xl border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
          <Skeleton className="mt-5 h-8 w-24" />
        </li>
      ))}
    </ul>
  );
}

export default function AdminPagesPage() {
  return (
    <>
      <AdminPageHeader
        title="Pages"
        description="Edit the public pages visually. Every change is kept as a draft until you publish it."
      />
      {/* The status needs request-time data; the shell renders immediately. */}
      <Suspense fallback={<PageListSkeleton />}>
        <PageList />
      </Suspense>
    </>
  );
}
