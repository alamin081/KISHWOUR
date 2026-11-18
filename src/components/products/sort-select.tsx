"use client";

import { useRouter } from "next/navigation";

import {
  catalogHref,
  type ProductListParams,
  SORT_OPTIONS,
  type SortValue,
} from "@/features/products/schemas";

/** Sort dropdown; navigates on change (database-side sorting). */
export function SortSelect({
  basePath,
  params,
}: {
  basePath: string;
  params: ProductListParams;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="catalog-sort"
        className="text-sm whitespace-nowrap text-muted-foreground"
      >
        Sort by
      </label>
      <select
        id="catalog-sort"
        value={params.sort}
        onChange={(e) =>
          router.push(
            catalogHref(basePath, params, { sort: e.target.value as SortValue }),
            { scroll: false },
          )
        }
        className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
