import { z } from "zod";

import { homepageImageSchema, type HomepageImage } from "@/features/homepage/schema";

/**
 * The block model behind the About, Our Craft, Sustainability, Wholesale and Contact
 * editors.
 *
 * A page document is an ordered list of typed blocks plus page-level SEO. Input and output
 * types are identical (no shape-changing transforms), so a document round-trips editor
 * state → Server Action → database → editor state unchanged. Optional text is an empty
 * string; empty means "do not render".
 */

const req = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `Use at most ${max} characters`);

const opt = (max: number) => z.string().trim().max(max, `Use at most ${max} characters`);

export const MAX_BLOCK_ITEMS = 12;
export const MAX_BLOCKS = 24;
export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 170;

/** Shared by every block. The array position decides the order. */
const base = {
  id: z.string().trim().min(1, "Missing block ID").max(60),
  visible: z.boolean(),
};

const tone = z.enum(["default", "muted"]);
/** Steps can also sit on the dark band used by the manufacturing process. */
const stepsTone = z.enum(["default", "dark"]);

const titledItem = z.object({
  id: z.string().trim().min(1).max(60),
  title: req(120, "Item heading"),
  text: req(600, "Item text"),
});

export type TitledItem = z.infer<typeof titledItem>;

const itemList = (label: string) =>
  z.array(titledItem).max(MAX_BLOCK_ITEMS, `Use at most ${MAX_BLOCK_ITEMS} ${label}`);

export const pageBlockSchema = z.discriminatedUnion("type", [
  /** Standard page heading (eyebrow, H1, intro) with breadcrumbs. */
  z.object({
    ...base,
    type: z.literal("header"),
    eyebrow: opt(60),
    title: req(160, "Heading"),
    description: opt(400),
  }),
  /** Wide heading with a photo and two buttons (the Wholesale page opener). */
  z.object({
    ...base,
    type: z.literal("hero"),
    eyebrow: opt(60),
    title: req(160, "Heading"),
    description: opt(400),
    primaryCtaLabel: opt(40),
    secondaryCtaLabel: opt(40),
    image: homepageImageSchema.nullable(),
  }),
  /**
   * Text section. A non-empty `mediaLabel` adds the photo column beside the text and is
   * the wording of the "… coming soon" placeholder until a photo is uploaded.
   */
  z.object({
    ...base,
    type: z.literal("editorial"),
    eyebrow: opt(60),
    title: req(160, "Heading"),
    body: req(3000, "Text"),
    mediaLabel: opt(60),
    image: homepageImageSchema.nullable(),
    reverse: z.boolean(),
    tone,
  }),
  /** Grid of cards, e.g. the wholesale services. */
  z.object({
    ...base,
    type: z.literal("cards"),
    eyebrow: opt(60),
    title: req(160, "Heading"),
    description: opt(400),
    items: itemList("cards"),
  }),
  /** Numbered steps, e.g. the manufacturing process. */
  z.object({
    ...base,
    type: z.literal("steps"),
    eyebrow: opt(60),
    title: req(160, "Heading"),
    centered: z.boolean(),
    tone: stepsTone,
    items: itemList("steps"),
  }),
  /** Text plus a tick list, e.g. custom manufacturing. */
  z.object({
    ...base,
    type: z.literal("checklist"),
    eyebrow: opt(60),
    title: req(160, "Heading"),
    text: opt(800),
    ctaLabel: opt(60),
    items: z.array(req(120, "List entry")).max(MAX_BLOCK_ITEMS),
    tone,
  }),
  /**
   * Verified commitments. Deliberately empty by default: only claims the business can
   * evidence may be published, and the editor says so.
   */
  z.object({
    ...base,
    type: z.literal("claims"),
    title: req(160, "Heading"),
    items: itemList("claims"),
  }),
  /** Small print under the content, e.g. the claims policy. */
  z.object({
    ...base,
    type: z.literal("note"),
    text: req(600, "Text"),
  }),
  /** Highlighted panel with an icon, e.g. the product-quality statement. */
  z.object({
    ...base,
    type: z.literal("callout"),
    title: req(160, "Heading"),
    text: req(1200, "Text"),
  }),
  /** The shared closing call to action; its wording lives in the Homepage editor. */
  z.object({
    ...base,
    type: z.literal("cta"),
    bordered: z.boolean(),
  }),
]);

export type PageBlock = z.infer<typeof pageBlockSchema>;
export type PageBlockType = PageBlock["type"];

export const pageSeoSchema = z.object({
  title: opt(SEO_TITLE_MAX),
  description: opt(SEO_DESCRIPTION_MAX),
});

export const pageDocumentSchema = z.object({
  seo: pageSeoSchema,
  blocks: z
    .array(pageBlockSchema)
    .max(MAX_BLOCKS, `Use at most ${MAX_BLOCKS} sections`)
    .superRefine((blocks, ctx) => {
      const seen = new Set<string>();
      blocks.forEach((block, index) => {
        if (seen.has(block.id)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "id"],
            message: "Duplicate section ID",
          });
        }
        seen.add(block.id);
      });
    }),
});

export type PageDocument = z.infer<typeof pageDocumentSchema>;

/** Validates a stored document. Returns null for anything that is not one. */
export function parsePageDocument(value: unknown): PageDocument | null {
  const parsed = pageDocumentSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/* --------------------------------------------------------------- operations */

export function findBlock(document: PageDocument, id: string): PageBlock | null {
  return document.blocks.find((block) => block.id === id) ?? null;
}

export function blockIndex(document: PageDocument, id: string): number {
  return document.blocks.findIndex((block) => block.id === id);
}

/** Returns a copy with one block shown or hidden. */
export function setBlockVisibility(
  document: PageDocument,
  id: string,
  visible: boolean,
): PageDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) =>
      block.id === id ? { ...block, visible } : block,
    ),
  };
}

/** Returns a copy with one block moved up (-1) or down (+1). */
export function moveBlock(
  document: PageDocument,
  id: string,
  direction: -1 | 1,
): PageDocument {
  const from = blockIndex(document, id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= document.blocks.length) return document;
  const blocks = [...document.blocks];
  const [moved] = blocks.splice(from, 1);
  if (moved) blocks.splice(to, 0, moved);
  return { ...document, blocks };
}

/** True when the block type carries an editorial image. */
export function blockHasImage(
  block: PageBlock,
): block is Extract<PageBlock, { image: HomepageImage | null }> {
  return block.type === "hero" || block.type === "editorial";
}

/** True when an image control should be offered for this block right now. */
export function blockAcceptsImage(block: PageBlock): boolean {
  if (block.type === "hero") return true;
  return block.type === "editorial" && block.mediaLabel !== "";
}

export function blockImage(document: PageDocument, id: string): HomepageImage | null {
  const block = findBlock(document, id);
  return block && blockHasImage(block) ? block.image : null;
}

/** Returns a copy with the image of one block replaced or removed. */
export function setBlockImage(
  document: PageDocument,
  id: string,
  image: HomepageImage | null,
): PageDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) =>
      block.id === id && blockHasImage(block) ? { ...block, image } : block,
    ),
  };
}

/** Returns a copy with the editor panel's values merged into one block. */
export function applyBlockValues(
  document: PageDocument,
  id: string,
  values: Record<string, unknown>,
): PageDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) =>
      block.id === id ? ({ ...block, ...values } as PageBlock) : block,
    ),
  };
}

/** Every image a document references, for Cloudinary clean-up. */
export function pageDocumentImages(document: PageDocument | null): HomepageImage[] {
  if (!document) return [];
  const images: HomepageImage[] = [];
  for (const block of document.blocks) {
    if (blockHasImage(block) && block.image) images.push(block.image);
  }
  return images;
}

/** A fresh ID for an item added in the editor. */
export function newItemId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return (
    random ?? `i-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  );
}

/** An empty list item. Blank on purpose - never seed example copy. */
export function emptyItem(): TitledItem {
  return { id: newItemId(), title: "", text: "" };
}
