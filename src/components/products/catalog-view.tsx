import { Download, MessageSquareQuote, Search, SearchX, X } from "lucide-react";
import Form from "next/form";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routes } from "@/config/site";
import { getActiveCategories } from "@/features/categories/queries";
import { getCatalogFacets, listProducts } from "@/features/products/queries";
import { catalogHref, type ProductListParams } from "@/features/products/schemas";

import { EmptyState } from "../shared/empty-state";
import { CatalogFilters } from "./catalog-filters";
import { MobileFilters } from "./mobile-filters";
import { Pagination } from "./pagination";
import { ProductCard } from "./product-card";
import { SortSelect } from "./sort-select";

type CatalogViewProps = {
  params: ProductListParams;
  /** Set on category pages (/products/<slug>). */
  categorySlug?: string;
};

/**
 * Product catalogue: filters (sidebar / mobile sheet), search, sort, active-filter chips,
 * grid and database pagination. Shared by /products and category pages.
 */
export async function CatalogView({ params, categorySlug }: CatalogViewProps) {
  const basePath = categorySlug ? routes.category(categorySlug) : routes.products;
  const current: ProductListParams = { ...params, category: categorySlug };

  // Categories and facets are cached; the listing is cached per filter combination.
  const [categories, facets, result] = await Promise.all([
    getActiveCategories(),
    getCatalogFacets(categorySlug),
    listProducts({
      page: params.page,
      sort: params.sort,
      q: params.q,
      category: categorySlug,
      type: params.type,
      material: params.material,
      featured: params.featured,
    }),
  ]);

  const chips = [
    params.q && {
      label: `“${params.q}”`,
      href: catalogHref(basePath, params, { q: undefined }),
    },
    params.type && {
      label: params.type,
      href: catalogHref(basePath, params, { type: undefined }),
    },
    params.material && {
      label: params.material,
      href: catalogHref(basePath, params, { material: undefined }),
    },
    params.featured && {
      label: "Featured",
      href: catalogHref(basePath, params, { featured: undefined }),
    },
  ].filter(Boolean) as { label: string; href: string }[];

  const filters = (
    <CatalogFilters
      basePath={basePath}
      params={params}
      categories={categories}
      activeCategory={categorySlug}
      facets={facets}
    />
  );
  const pdfHref = categorySlug
    ? `${routes.catalogPdf}?category=${categorySlug}`
    : routes.catalogPdf;

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_1fr] xl:gap-14">
      <aside aria-label="Product filters" className="hidden lg:block">
        <div className="sticky top-28">{filters}</div>
      </aside>

      <div className="min-w-0">
        {/* Toolbar: search · results · sort · mobile filters */}
        <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <Form action={basePath} role="search" className="flex w-full gap-2 sm:max-w-sm">
            {params.type ? <input type="hidden" name="type" value={params.type} /> : null}
            {params.material ? (
              <input type="hidden" name="material" value={params.material} />
            ) : null}
            {params.featured ? <input type="hidden" name="featured" value="1" /> : null}
            {params.sort !== "featured" ? (
              <input type="hidden" name="sort" value={params.sort} />
            ) : null}
            <label htmlFor="catalog-q" className="sr-only">
              Search by name, SKU or category
            </label>
            <Input
              id="catalog-q"
              name="q"
              type="search"
              defaultValue={params.q}
              maxLength={100}
              placeholder="Search name, SKU or category"
            />
            <Button type="submit" variant="secondary" size="icon" aria-label="Search">
              <Search aria-hidden />
            </Button>
          </Form>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <MobileFilters activeCount={chips.length}>{filters}</MobileFilters>
            <SortSelect basePath={basePath} params={current} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {result.total === 1
              ? "1 product"
              : `${result.total.toLocaleString("en-US")} products`}
          </p>
          <a
            href={pdfHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
          >
            <Download className="size-4" aria-hidden /> Download catalogue (PDF)
          </a>
        </div>

        {chips.length > 0 ? (
          <ul className="mb-6 flex flex-wrap gap-2" aria-label="Active filters">
            {chips.map((c) => (
              <li key={c.label}>
                <Link
                  href={c.href}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-secondary px-3 text-sm transition-colors hover:bg-beige"
                >
                  {c.label}
                  <X className="size-3.5" aria-hidden />
                  <span className="sr-only">Remove filter</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={basePath}
                className="inline-flex h-8 items-center px-2 text-sm text-muted-foreground underline-offset-4 hover:text-forest hover:underline"
              >
                Clear all
              </Link>
            </li>
          </ul>
        ) : null}

        {result.items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
              {result.items.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 3} />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              hrefFor={(page) => catalogHref(basePath, params, { page })}
            />
          </>
        ) : chips.length > 0 ? (
          <EmptyState
            icon={SearchX}
            title="No products match these filters"
            description="Try removing a filter or searching for something else — or ask us directly; we may be able to make it for you."
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="secondary">
                  <Link href={basePath}>Clear filters</Link>
                </Button>
                <Button asChild>
                  <Link href={routes.requestQuote}>
                    <MessageSquareQuote aria-hidden /> Request a Quote
                  </Link>
                </Button>
              </div>
            }
          />
        ) : (
          <EmptyState
            title={
              categorySlug ? "Products coming soon" : "Our catalogue is being prepared"
            }
            description="Products will be published here soon. You can already send us a wholesale or custom-manufacturing inquiry."
            action={
              <Button asChild>
                <Link href={routes.requestQuote}>
                  <MessageSquareQuote aria-hidden /> Request a Quote
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
