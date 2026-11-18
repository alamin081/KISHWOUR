/**
 * The homepage is a fixed set of sections. Their IDs are the storage keys of the
 * homepage content document, so they must never be renamed without a data migration.
 */

export const HOMEPAGE_SECTION_IDS = [
  "hero",
  "categories",
  "featured",
  "about",
  "craft",
  "wholesale",
  "customManufacturing",
  "sustainability",
  "testimonials",
  "contact",
] as const;

export type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];

export type HomepageSectionMeta = {
  id: HomepageSectionId;
  /** Shown in the editor sidebar, overlay and panel heading. */
  label: string;
  /** One line explaining what the section does and where its data comes from. */
  hint: string;
  /** Whether the section carries an editorial image that an admin can upload. */
  hasImage: boolean;
  /** False for sections whose fields are not editable yet (testimonials, part 2). */
  editable: boolean;
  /** Links to the admin pages that own this section's data (images, items). */
  manageLinks?: { href: string; label: string }[];
};

export const HOMEPAGE_SECTIONS: Record<HomepageSectionId, HomepageSectionMeta> = {
  hero: {
    id: "hero",
    label: "Hero",
    hint: "The first screen: headline, intro text, two buttons and the lead photo.",
    hasImage: true,
    editable: true,
  },
  categories: {
    id: "categories",
    label: "Categories",
    hint: "Heading and intro only. The cards come from your categories.",
    hasImage: false,
    editable: true,
    manageLinks: [{ href: "/admin/categories", label: "Manage categories & images" }],
  },
  featured: {
    id: "featured",
    label: "Featured products",
    hint: "Heading only. The cards come from products marked as featured.",
    hasImage: false,
    editable: true,
    manageLinks: [{ href: "/admin/products", label: "Manage products & featured items" }],
  },
  about: {
    id: "about",
    label: "About",
    hint: "Short brand introduction with a photo and a link to the About page.",
    hasImage: true,
    editable: true,
  },
  craft: {
    id: "craft",
    label: "Our Craft",
    hint: "Dark section with a photo and up to six craft points.",
    hasImage: true,
    editable: true,
  },
  wholesale: {
    id: "wholesale",
    label: "Wholesale",
    hint: "Green panel with the wholesale pitch, two buttons and a bullet list.",
    hasImage: false,
    editable: true,
  },
  customManufacturing: {
    id: "customManufacturing",
    label: "Custom manufacturing",
    hint: "OEM / ODM section with a checklist of what buyers can ask about.",
    hasImage: false,
    editable: true,
  },
  sustainability: {
    id: "sustainability",
    label: "Sustainability",
    hint: "Natural-materials section with a photo. Verified claims come from site content.",
    hasImage: true,
    editable: true,
  },
  testimonials: {
    id: "testimonials",
    label: "Testimonials",
    hint: "Real quotes from real buyers only. The section is hidden while the list is empty.",
    hasImage: false,
    editable: true,
  },
  contact: {
    id: "contact",
    label: "Contact CTA",
    hint: "Closing call to action. The WhatsApp button appears only when a number is set.",
    hasImage: false,
    editable: true,
  },
};

export const HOMEPAGE_SECTION_LIST: readonly HomepageSectionMeta[] =
  HOMEPAGE_SECTION_IDS.map((id) => HOMEPAGE_SECTIONS[id]);

export function isHomepageSectionId(value: unknown): value is HomepageSectionId {
  return (
    typeof value === "string" &&
    (HOMEPAGE_SECTION_IDS as readonly string[]).includes(value)
  );
}
