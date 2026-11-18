import { z } from "zod";

import { homeContent } from "@/content/site-content";
import { COUNTRY_CODES } from "@/lib/data/countries";

import { imageDisplaySchema } from "./image-display";
import { isCloudinaryDeliveryUrl } from "./image-url";
import { HOMEPAGE_SECTION_IDS, type HomepageSectionId } from "./sections";

/**
 * Homepage content document - the single source of truth for the public homepage.
 *
 * Input and output types are deliberately identical (no shape-changing transforms), so the
 * same object can round-trip editor state → Server Action → database → editor state.
 * Optional text is an empty string rather than `undefined`; empty means "do not render".
 */

const req = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `Use at most ${max} characters`);

const opt = (max: number) => z.string().trim().max(max, `Use at most ${max} characters`);

export const MAX_CRAFT_POINTS = 6;
export const MAX_WHOLESALE_POINTS = 8;
export const MAX_CUSTOM_OPTIONS = 10;
export const MAX_TESTIMONIALS = 12;

export const homepageImageSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Upload an image first")
    .max(600, "Use at most 600 characters")
    .refine(
      isCloudinaryDeliveryUrl,
      "Only images uploaded to our Cloudinary account can be used",
    ),
  alt: req(200, "Alt text"),
  /** Cloudinary public ID, kept so the asset can be cleaned up after publishing. */
  publicId: opt(300),
  /**
   * Fit mode, crop, zoom and position per device, set in the Edit Image dialog.
   * Optional: images saved before this existed render exactly as before (cover, centred).
   */
  display: imageDisplaySchema.optional(),
});

export type HomepageImage = z.infer<typeof homepageImageSchema>;

/**
 * One published testimonial.
 *
 * Only real, permitted quotes from real buyers belong here - the editor says so and the
 * defaults are deliberately empty. Nothing is ever pre-filled or generated.
 */
export const testimonialSchema = z.object({
  /** Stable key for list rendering and reordering; generated in the editor. */
  id: z.string().trim().min(1, "Missing ID").max(60),
  quote: req(700, "Quote"),
  name: req(80, "Name"),
  role: opt(80),
  company: opt(80),
  /** ISO 3166-1 alpha-2, or "" when not given. */
  country: z
    .string()
    .trim()
    .toUpperCase()
    .max(2, "Use a two-letter country code")
    .refine((v) => v === "" || COUNTRY_CODES.has(v), "Choose a country from the list"),
  photo: homepageImageSchema.nullable(),
});

export type HomepageTestimonial = z.infer<typeof testimonialSchema>;

export const testimonialListSchema = z
  .array(testimonialSchema)
  .max(MAX_TESTIMONIALS, `Use at most ${MAX_TESTIMONIALS} testimonials`)
  .superRefine((items, ctx) => {
    const seen = new Set<string>();
    items.forEach((item, index) => {
      if (seen.has(item.id)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "id"],
          message: "Duplicate testimonial ID",
        });
      }
      seen.add(item.id);
    });
  });

/** A fresh ID for a testimonial added in the editor. */
export function newTestimonialId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return (
    random ?? `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}

/** An empty testimonial row. Every field is blank on purpose - never seed example text. */
export function emptyTestimonial(): HomepageTestimonial {
  return {
    id: newTestimonialId(),
    quote: "",
    name: "",
    role: "",
    company: "",
    country: "",
    photo: null,
  };
}

const visibility = {
  visible: z.boolean(),
  order: z.number().int("Use a whole number").min(0).max(99),
};

const bulletList = (max: number, label: string) =>
  z.array(req(80, label)).max(max, `Use at most ${max} entries`);

export const homepageSectionSchemas = {
  hero: z.object({
    ...visibility,
    eyebrow: opt(60),
    title: req(160, "Hero heading"),
    subtitle: req(400, "Hero subheading"),
    primaryCtaLabel: req(40, "First button label"),
    secondaryCtaLabel: opt(40),
    image: homepageImageSchema.nullable(),
  }),
  categories: z.object({
    ...visibility,
    eyebrow: opt(60),
    title: req(120, "Heading"),
    description: opt(400),
    ctaLabel: opt(40),
  }),
  featured: z.object({
    ...visibility,
    eyebrow: opt(60),
    title: req(120, "Heading"),
    description: opt(400),
    ctaLabel: opt(40),
  }),
  about: z.object({
    ...visibility,
    eyebrow: opt(60),
    title: req(160, "Heading"),
    body: req(2000, "About text"),
    linkLabel: opt(60),
    image: homepageImageSchema.nullable(),
  }),
  craft: z.object({
    ...visibility,
    eyebrow: opt(60),
    title: req(160, "Heading"),
    points: z
      .array(z.object({ title: req(80, "Point heading"), text: req(400, "Point text") }))
      .max(MAX_CRAFT_POINTS, `Use at most ${MAX_CRAFT_POINTS} points`),
    ctaLabel: opt(60),
    image: homepageImageSchema.nullable(),
  }),
  wholesale: z.object({
    ...visibility,
    eyebrow: opt(60),
    title: req(160, "Heading"),
    text: req(600, "Text"),
    points: bulletList(MAX_WHOLESALE_POINTS, "List entry"),
    primaryCtaLabel: req(40, "First button label"),
    secondaryCtaLabel: opt(40),
  }),
  customManufacturing: z.object({
    ...visibility,
    eyebrow: opt(60),
    title: req(160, "Heading"),
    text: req(600, "Text"),
    optionsHeading: opt(120),
    options: bulletList(MAX_CUSTOM_OPTIONS, "List entry"),
    ctaLabel: opt(60),
  }),
  sustainability: z.object({
    ...visibility,
    eyebrow: opt(60),
    title: req(160, "Heading"),
    text: req(600, "Text"),
    linkLabel: opt(60),
    image: homepageImageSchema.nullable(),
  }),
  testimonials: z.object({
    ...visibility,
    eyebrow: opt(60),
    title: req(120, "Heading"),
    items: testimonialListSchema,
  }),
  contact: z.object({
    ...visibility,
    title: req(160, "Heading"),
    text: req(400, "Text"),
    primaryCtaLabel: req(40, "First button label"),
    secondaryCtaLabel: opt(40),
    whatsappLabel: opt(40),
  }),
} as const satisfies Record<HomepageSectionId, z.ZodType>;

export const homepageContentSchema = z.object(homepageSectionSchemas);

export type HomepageContent = z.infer<typeof homepageContentSchema>;

/**
 * Per-section schemas for the editor panel's React Hook Form.
 *
 * `visible` and `order` are driven by the hover controls and `image` by the upload control,
 * so they are owned by the editor state rather than by the form. Everything is validated
 * again as a whole document by the Server Action.
 */
const omitEditorOwned = { visible: true, order: true } as const;

export const homepageSectionFormSchemas = {
  hero: homepageSectionSchemas.hero.omit({ ...omitEditorOwned, image: true }),
  categories: homepageSectionSchemas.categories.omit(omitEditorOwned),
  featured: homepageSectionSchemas.featured.omit(omitEditorOwned),
  about: homepageSectionSchemas.about.omit({ ...omitEditorOwned, image: true }),
  craft: homepageSectionSchemas.craft.omit({ ...omitEditorOwned, image: true }),
  wholesale: homepageSectionSchemas.wholesale.omit(omitEditorOwned),
  customManufacturing: homepageSectionSchemas.customManufacturing.omit(omitEditorOwned),
  sustainability: homepageSectionSchemas.sustainability.omit({
    ...omitEditorOwned,
    image: true,
  }),
  testimonials: homepageSectionSchemas.testimonials.omit(omitEditorOwned),
  contact: homepageSectionSchemas.contact.omit(omitEditorOwned),
} as const;

export type HomepageSectionFormValues<K extends HomepageSectionId> = z.infer<
  (typeof homepageSectionFormSchemas)[K]
>;

/** Sections that carry an editorial image, narrowed for the image controls. */
export const HOMEPAGE_IMAGE_SECTION_IDS = [
  "hero",
  "about",
  "craft",
  "sustainability",
] as const;
export type HomepageImageSectionId = (typeof HOMEPAGE_IMAGE_SECTION_IDS)[number];

export function sectionHasImage(id: HomepageSectionId): id is HomepageImageSectionId {
  return (HOMEPAGE_IMAGE_SECTION_IDS as readonly string[]).includes(id);
}

/**
 * The content shipped in `src/content/site-content.ts`. Used whenever nothing is published
 * (or the database is unreachable), so the public homepage never breaks and looks exactly
 * the same as before an admin publishes their first edit.
 */
export const defaultHomepageContent: HomepageContent = {
  hero: {
    visible: true,
    order: 0,
    eyebrow: homeContent.hero.eyebrow,
    title: homeContent.hero.title,
    subtitle: homeContent.hero.subtitle,
    primaryCtaLabel: "Explore Our Products",
    secondaryCtaLabel: "Become a Wholesale Partner",
    image: null,
  },
  categories: {
    visible: true,
    order: 1,
    eyebrow: "Collections",
    title: "Shop by category",
    description:
      "Handmade product lines from Bangladesh, available for wholesale and custom orders.",
    ctaLabel: "All categories",
  },
  featured: {
    visible: true,
    order: 2,
    eyebrow: "Featured",
    title: "Featured products",
    description: "",
    ctaLabel: "View all products",
  },
  about: {
    visible: true,
    order: 3,
    eyebrow: homeContent.about.eyebrow,
    title: homeContent.about.title,
    body: homeContent.about.body.join("\n\n"),
    linkLabel: "More about Kishwour",
    image: null,
  },
  craft: {
    visible: true,
    order: 4,
    eyebrow: homeContent.craft.eyebrow,
    title: homeContent.craft.title,
    points: homeContent.craft.points.map((p) => ({ title: p.title, text: p.text })),
    ctaLabel: "Discover our craft",
    image: null,
  },
  wholesale: {
    visible: true,
    order: 5,
    eyebrow: homeContent.wholesale.eyebrow,
    title: homeContent.wholesale.title,
    text: homeContent.wholesale.text,
    points: [...homeContent.wholesale.points],
    primaryCtaLabel: "Request a Quote",
    secondaryCtaLabel: "Wholesale information",
  },
  customManufacturing: {
    visible: true,
    order: 6,
    eyebrow: homeContent.customManufacturing.eyebrow,
    title: homeContent.customManufacturing.title,
    text: homeContent.customManufacturing.text,
    optionsHeading: "What you can ask us about",
    options: [...homeContent.customManufacturing.options],
    ctaLabel: "Custom manufacturing details",
  },
  sustainability: {
    visible: true,
    order: 7,
    eyebrow: homeContent.sustainability.eyebrow,
    title: homeContent.sustainability.title,
    text: homeContent.sustainability.text,
    linkLabel: "Our approach to sustainability",
    image: null,
  },
  testimonials: {
    visible: true,
    order: 8,
    eyebrow: "Buyers",
    title: "What our partners say",
    // Empty on purpose: the section stays hidden until real testimonials are added.
    items: [],
  },
  contact: {
    visible: true,
    order: 9,
    title: homeContent.contact.title,
    text: homeContent.contact.text,
    primaryCtaLabel: "Request a Quote",
    secondaryCtaLabel: "Contact Us",
    whatsappLabel: "WhatsApp",
  },
};

/** The four homepage texts that the older `settings.home` editor manages. */
export type LegacyHomeSettings = {
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutBody: string;
};

/**
 * Defaults seeded with whatever the previous `settings.home` editor saved, so the live
 * homepage stays identical for a site that already edited those four fields.
 */
export function homepageDefaultsFrom(home: LegacyHomeSettings): HomepageContent {
  const base = structuredClone(defaultHomepageContent);
  base.hero.title = home.heroTitle;
  base.hero.subtitle = home.heroSubtitle;
  base.about.title = home.aboutTitle;
  base.about.body = home.aboutBody;
  return base;
}

/** Validates stored JSON. Returns null for anything that is not a valid document. */
export function parseHomepageContent(value: unknown): HomepageContent | null {
  const parsed = homepageContentSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** Stored content when it is valid, otherwise the given fallback. Never throws. */
export function resolveHomepageContent(
  value: unknown,
  fallback: HomepageContent,
): HomepageContent {
  return parseHomepageContent(value) ?? fallback;
}

/** Section IDs in display order (ties broken by the canonical order). */
export function orderedSectionIds(content: HomepageContent): HomepageSectionId[] {
  return [...HOMEPAGE_SECTION_IDS].sort((a, b) => {
    const delta = content[a].order - content[b].order;
    return delta !== 0
      ? delta
      : HOMEPAGE_SECTION_IDS.indexOf(a) - HOMEPAGE_SECTION_IDS.indexOf(b);
  });
}

/** Rewrites `order` to 0..n-1 so stored documents never contain gaps or duplicates. */
export function normalizeSectionOrder(content: HomepageContent): HomepageContent {
  const next = structuredClone(content);
  orderedSectionIds(content).forEach((id, index) => {
    next[id].order = index;
  });
  return next;
}

/** Moves one section up or down and renumbers every section. */
export function moveSection(
  content: HomepageContent,
  id: HomepageSectionId,
  direction: -1 | 1,
): HomepageContent {
  const order = orderedSectionIds(content);
  const from = order.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= order.length) return content;
  const reordered = [...order];
  const [moved] = reordered.splice(from, 1);
  if (moved) reordered.splice(to, 0, moved);
  const next = structuredClone(content);
  reordered.forEach((sectionId, index) => {
    next[sectionId].order = index;
  });
  return next;
}

/** Returns a copy with one section shown or hidden. */
export function setSectionVisibility(
  content: HomepageContent,
  id: HomepageSectionId,
  visible: boolean,
): HomepageContent {
  const next = structuredClone(content);
  next[id].visible = visible;
  return next;
}

/** Returns a copy with the editor panel's values merged into one section. */
export function applySectionValues<K extends HomepageSectionId>(
  content: HomepageContent,
  id: K,
  values: HomepageSectionFormValues<K>,
): HomepageContent {
  const next = structuredClone(content);
  Object.assign(next[id], values);
  return next;
}

/** Returns a copy with the image of one image-bearing section replaced or removed. */
export function setSectionImage(
  content: HomepageContent,
  id: HomepageImageSectionId,
  image: HomepageImage | null,
): HomepageContent {
  const next = structuredClone(content);
  next[id].image = image;
  return next;
}

/** The image of a section, or null when the section carries none. */
export function sectionImage(
  content: HomepageContent,
  id: HomepageSectionId,
): HomepageImage | null {
  return sectionHasImage(id) ? content[id].image : null;
}

/** Splits a textarea value into paragraphs (blank line = new paragraph). */
export function contentParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
