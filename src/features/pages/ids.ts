import { routes } from "@/config/site";

/**
 * The pages an admin can edit visually.
 *
 * "home" keeps its original `homepage.*` storage keys from Phase 08 Part 1/2, so nothing
 * stored before this phase needs migrating. Every other page uses `page.<id>.*`.
 */
export const EDITABLE_PAGE_IDS = [
  "home",
  "about",
  "our-craft",
  "sustainability",
  "wholesale",
  "contact",
] as const;

export type EditablePageId = (typeof EDITABLE_PAGE_IDS)[number];

export function isEditablePageId(value: unknown): value is EditablePageId {
  return (
    typeof value === "string" && (EDITABLE_PAGE_IDS as readonly string[]).includes(value)
  );
}

export type EditablePageMeta = {
  id: EditablePageId;
  /** Shown in the admin list and the editor heading. */
  label: string;
  /** One line describing what lives on the page. */
  description: string;
  /** Public route the editor previews. */
  path: string;
};

export const EDITABLE_PAGES: Record<EditablePageId, EditablePageMeta> = {
  home: {
    id: "home",
    label: "Homepage",
    description:
      "Hero, categories, featured products, about, craft, wholesale, testimonials and the closing call to action.",
    path: routes.home,
  },
  about: {
    id: "about",
    label: "About Us",
    description: "Company introduction, brand story, mission and craftsmanship sections.",
    path: routes.about,
  },
  "our-craft": {
    id: "our-craft",
    label: "Our Craft",
    description: "How products are made, the manufacturing process and product quality.",
    path: routes.craft,
  },
  sustainability: {
    id: "sustainability",
    label: "Sustainability",
    description: "Natural materials, reusable products and verified commitments.",
    path: routes.sustainability,
  },
  wholesale: {
    id: "wholesale",
    label: "Wholesale",
    description:
      "Wholesale services, custom manufacturing (OEM/ODM) and the ordering steps.",
    path: routes.wholesale,
  },
  contact: {
    id: "contact",
    label: "Contact",
    description:
      "Page heading and intro only. Contact details come from Content → Contact details.",
    path: routes.contact,
  },
};

export const EDITABLE_PAGE_LIST: readonly EditablePageMeta[] = EDITABLE_PAGE_IDS.map(
  (id) => EDITABLE_PAGES[id],
);

/* ------------------------------------------------------------------ storage */

/**
 * `SiteSetting` keys. The homepage keeps the keys it has always used; the other pages are
 * namespaced per page. No new table and no migration.
 */
export function draftKey(pageId: EditablePageId): string {
  return pageId === "home" ? "homepage.draft" : `page.${pageId}.draft`;
}

export function publishedKey(pageId: EditablePageId): string {
  return pageId === "home" ? "homepage.published" : `page.${pageId}.published`;
}

export function historyKey(pageId: EditablePageId): string {
  return pageId === "home" ? "homepage.history" : `page.${pageId}.history`;
}

/**
 * One shared upload-tracking list for every page, so cleanup can check an image against
 * all pages at once. `homepage.uploads` from Part 2 is merged in and then emptied.
 */
export const UPLOADS_KEY = "site.uploads";
export const LEGACY_HOMEPAGE_UPLOADS_KEY = "homepage.uploads";

/** Cache tag for one page's published document. */
export function pageTag(pageId: EditablePageId): string {
  return pageId === "home" ? "site:homepage" : `site:page:${pageId}`;
}

/** Every key this feature reads when checking image references across all pages. */
export function allContentKeys(): string[] {
  return EDITABLE_PAGE_IDS.flatMap((id) => [
    draftKey(id),
    publishedKey(id),
    historyKey(id),
  ]);
}
