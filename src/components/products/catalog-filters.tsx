import { Check } from "lucide-react";
import Link from "next/link";

import { routes } from "@/config/site";
import { type CategorySummary } from "@/features/categories/types";
import { catalogHref, type ProductListParams } from "@/features/products/schemas";
import { type CatalogFacets } from "@/features/products/types";
import { cn } from "@/lib/utils";

type CatalogFiltersProps = {
  basePath: string;
  params: ProductListParams;
  categories: CategorySummary[];
  activeCategory?: string;
  facets: CatalogFacets;
};

function FilterLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-forest/10 font-semibold text-forest"
          : "text-charcoal/85 hover:bg-secondary/70",
      )}
    >
      <span className="flex items-center gap-2">
        {active ? <Check className="size-3.5" aria-hidden /> : null}
        {label}
      </span>
      {typeof count === "number" ? (
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      ) : null}
    </Link>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b pb-5 last:border-b-0">
      <h2 className="mb-2 font-sans text-xs font-semibold tracking-[0.16em] text-charcoal uppercase">
        {title}
      </h2>
      <ul className="space-y-0.5">{children}</ul>
    </section>
  );
}

/** Filter panel (category, product type, material, featured). Plain links — works without JS. */
export function CatalogFilters({
  basePath,
  params,
  categories,
  activeCategory,
  facets,
}: CatalogFiltersProps) {
  // Category links switch path (/products/<slug>) and keep the other filters.
  const keep = { ...params, category: undefined };

  return (
    <div className="space-y-5">
      <Group title="Category">
        <li>
          <FilterLink
            href={catalogHref(routes.products, keep)}
            active={!activeCategory}
            label="All products"
          />
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <FilterLink
              href={catalogHref(routes.category(c.slug), keep)}
              active={activeCategory === c.slug}
              label={c.name}
              count={c.productCount}
            />
          </li>
        ))}
      </Group>

      {facets.productTypes.length > 0 ? (
        <Group title="Product type">
          {facets.productTypes.map((t) => {
            const active = params.type?.toLowerCase() === t.value.toLowerCase();
            return (
              <li key={t.value}>
                <FilterLink
                  href={catalogHref(basePath, params, {
                    type: active ? undefined : t.value,
                  })}
                  active={active}
                  label={t.value}
                  count={t.count}
                />
              </li>
            );
          })}
        </Group>
      ) : null}

      {facets.materials.length > 0 ? (
        <Group title="Material">
          {facets.materials.map((m) => {
            const active = params.material === m.value;
            return (
              <li key={m.value}>
                <FilterLink
                  href={catalogHref(basePath, params, {
                    material: active ? undefined : m.value,
                  })}
                  active={active}
                  label={m.value}
                  count={m.count}
                />
              </li>
            );
          })}
        </Group>
      ) : null}

      <Group title="Highlights">
        <li>
          <FilterLink
            href={catalogHref(basePath, params, { featured: !params.featured })}
            active={params.featured}
            label="Featured products"
          />
        </li>
      </Group>
    </div>
  );
}
