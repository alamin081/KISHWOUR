import { z } from "zod";

export const PRODUCTS_PAGE_SIZE = 12;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured first" },
  { value: "newest", label: "Newest" },
  { value: "name-asc", label: "Name: A–Z" },
  { value: "name-desc", label: "Name: Z–A" },
  { value: "moq-asc", label: "Minimum order: low to high" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];
const sortValues = SORT_OPTIONS.map((o) => o.value) as [SortValue, ...SortValue[]];

const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(120);

const facetValue = z.string().trim().min(1).max(60);

/** Validates catalogue URL search params. Invalid values fall back to safe defaults. */
export const productListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).catch(1),
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .catch(undefined)
    .transform((v) => (v ? v : undefined)),
  category: slug.optional().catch(undefined),
  type: facetValue.optional().catch(undefined),
  material: facetValue.optional().catch(undefined),
  featured: z
    .enum(["1", "true"])
    .optional()
    .catch(undefined)
    .transform((v) => v !== undefined),
  sort: z.enum(sortValues).catch("featured"),
});

export type ProductListParams = z.infer<typeof productListParamsSchema>;

/** Next.js searchParams values can be string | string[] | undefined — keep the first. */
export function parseProductListParams(
  raw: Record<string, string | string[] | undefined>,
): ProductListParams {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return productListParamsSchema.parse({
    page: first(raw["page"]),
    q: first(raw["q"]),
    category: first(raw["category"]),
    type: first(raw["type"]),
    material: first(raw["material"]),
    featured: first(raw["featured"]),
    sort: first(raw["sort"]) ?? "featured",
  });
}

/** Filters that change the result set (everything except page and sort). */
export type CatalogFilters = Pick<
  ProductListParams,
  "q" | "category" | "type" | "material" | "featured"
>;

/**
 * Builds a catalogue URL from the current params plus overrides. `undefined`/`false` removes a
 * param; any filter change resets to page 1 unless a page is given.
 */
export function catalogHref(
  basePath: string,
  current: Partial<ProductListParams>,
  overrides: Partial<
    Record<keyof ProductListParams, string | number | boolean | undefined>
  > = {},
): string {
  const merged: Record<string, unknown> = { ...current, ...overrides };
  if (!("page" in overrides)) merged["page"] = undefined;
  const sp = new URLSearchParams();
  const order: (keyof ProductListParams)[] = [
    "q",
    "category",
    "type",
    "material",
    "featured",
    "sort",
    "page",
  ];
  for (const key of order) {
    const value = merged[key];
    if (value === undefined || value === false || value === "") continue;
    if (key === "sort" && value === "featured") continue;
    if (key === "page" && Number(value) <= 1) continue;
    sp.set(key, value === true ? "1" : String(value));
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
