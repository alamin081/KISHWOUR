import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { absoluteUrl } from "@/config/site";

import { JsonLd } from "./json-ld";

export type Crumb = { label: string; href: string };

/** Visible breadcrumb trail + BreadcrumbList structured data. Last item is the current page. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {all.map((crumb, i) => {
            const isLast = i === all.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {isLast ? (
                  <span
                    aria-current="page"
                    className="line-clamp-1 font-medium text-foreground"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <>
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-forest"
                    >
                      {crumb.label}
                    </Link>
                    <ChevronRight className="size-3.5" aria-hidden />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: crumb.label,
            item: absoluteUrl(crumb.href),
          })),
        }}
      />
    </>
  );
}
