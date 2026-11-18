import { collectImages } from "@/features/homepage/cleanup";
import { changedSectionIds } from "@/features/homepage/compare";
import {
  defaultHomepageContent,
  type HomepageImage,
  homepageDefaultsFrom,
  orderedSectionIds,
  parseHomepageContent,
} from "@/features/homepage/schema";
import { HOMEPAGE_SECTIONS } from "@/features/homepage/sections";
import { type Settings } from "@/features/settings/schema";

import {
  blockAcceptsImage,
  blockHasImage,
  type PageBlock,
  type PageDocument,
  pageDocumentImages,
  parsePageDocument,
} from "./blocks";
import { deepEqual } from "./compare";
import { type BlockPageId, pageDefaults } from "./defaults";
import { type EditablePageId } from "./ids";

/**
 * One interface over two content models: the homepage's keyed sections (Phase 08 Part 1/2,
 * unchanged on disk) and the block documents behind the other pages.
 *
 * Documents cross this boundary as `unknown` and each page validates with its own Zod
 * schema, so the shared engine - queries, Server Actions, clean-up and the editor shell -
 * never needs to know which model it is working with.
 */
export type PageSectionInfo = {
  id: string;
  label: string;
  hint: string;
  /** Whether an image control should be offered for this section right now. */
  hasImageSlot: boolean;
  /** Whether the section has an image set. */
  hasImage: boolean;
  visible: boolean;
  editable: boolean;
  manageLinks?: { href: string; label: string }[];
};

export type PageContentOps = {
  /** Validates stored JSON; null when it is not a valid document for this page. */
  parse(value: unknown): unknown | null;
  /** The content shipped in code (and, for About, whatever the old form saved). */
  defaults(settings: Settings): unknown;
  /** Every image the document references, for Cloudinary clean-up. */
  images(document: unknown): HomepageImage[];
  /** Section IDs in display order. */
  sectionIds(document: unknown): string[];
  /** Per-section information the editor chrome needs. */
  sections(document: unknown): PageSectionInfo[];
  /** Section IDs that differ between two documents. */
  changedSections(previous: unknown, next: unknown): string[];
};

/* ------------------------------------------------------------------- home */

const homeOps: PageContentOps = {
  parse: (value) => parseHomepageContent(value),
  defaults: (settings) => homepageDefaultsFrom(settings.home),
  images: (document) => collectImages(parseHomepageContent(document)),
  sectionIds: (document) => {
    const content = parseHomepageContent(document);
    return content ? orderedSectionIds(content) : [];
  },
  sections: (document) => {
    const content = parseHomepageContent(document);
    if (!content) return [];
    return orderedSectionIds(content).map((id) => {
      const meta = HOMEPAGE_SECTIONS[id];
      const image = meta.hasImage ? collectSectionImage(content, id) : null;
      return {
        id,
        label: meta.label,
        hint: meta.hint,
        hasImageSlot: meta.hasImage,
        hasImage: image !== null,
        visible: content[id].visible,
        editable: meta.editable,
        ...(meta.manageLinks ? { manageLinks: meta.manageLinks } : {}),
      };
    });
  },
  changedSections: (previous, next) => {
    const a = parseHomepageContent(previous);
    const b = parseHomepageContent(next);
    if (!a || !b) return [];
    return changedSectionIds(a, b);
  },
};

function collectSectionImage(
  content: ReturnType<typeof parseHomepageContent>,
  id: string,
): HomepageImage | null {
  if (!content) return null;
  const section = content[id as keyof typeof content];
  return section && "image" in section ? section.image : null;
}

/* ----------------------------------------------------------- block pages */

const BLOCK_LABELS: Record<PageBlock["type"], string> = {
  header: "Page heading",
  hero: "Page heading",
  editorial: "Text section",
  cards: "Cards",
  steps: "Steps",
  checklist: "Checklist",
  claims: "Verified commitments",
  note: "Small print",
  callout: "Highlighted panel",
  cta: "Closing call to action",
};

const BLOCK_HINTS: Record<PageBlock["type"], string> = {
  header: "The page title, the line above it and the intro paragraph.",
  hero: "Opening block with a photo and two buttons.",
  editorial: "A heading with paragraphs, and optionally a photo beside them.",
  cards: "A grid of cards. Their links follow the card ID.",
  steps: "Numbered steps shown in order.",
  checklist: "Text with a tick list beside it.",
  claims: "Only publish commitments you can evidence. Empty means hidden.",
  note: "One short paragraph of small print.",
  callout: "A single highlighted statement.",
  cta: "Wording comes from the Homepage editor's Contact section.",
};

/** A readable label for one block: its own heading when it has one. */
function blockLabel(block: PageBlock): string {
  const base = BLOCK_LABELS[block.type];
  if ("title" in block && block.title.trim()) {
    return `${base} · ${block.title.trim().slice(0, 40)}`;
  }
  return base;
}

function blockOps(pageId: BlockPageId): PageContentOps {
  return {
    parse: (value) => parsePageDocument(value),
    defaults: (settings) => pageDefaults(pageId, settings),
    images: (document) => pageDocumentImages(parsePageDocument(document)),
    sectionIds: (document) =>
      parsePageDocument(document)?.blocks.map((block) => block.id) ?? [],
    sections: (document) => {
      const parsed = parsePageDocument(document);
      if (!parsed) return [];
      return parsed.blocks.map((block) => ({
        id: block.id,
        label: blockLabel(block),
        hint: BLOCK_HINTS[block.type],
        hasImageSlot: blockAcceptsImage(block),
        hasImage: blockHasImage(block) && block.image !== null,
        visible: block.visible,
        editable: block.type !== "cta",
        ...(block.type === "cta"
          ? {
              manageLinks: [
                { href: "/admin/pages/home", label: "Edit the wording on the Homepage" },
              ],
            }
          : {}),
      }));
    },
    changedSections: (previous, next) => {
      const a = parsePageDocument(previous);
      const b = parsePageDocument(next);
      if (!a || !b) return [];
      const ids = new Set([
        ...a.blocks.map((block) => block.id),
        ...b.blocks.map((block) => block.id),
      ]);
      const changed: string[] = [];
      if (!deepEqual(a.seo, b.seo)) changed.push("seo");
      for (const id of ids) {
        const left = a.blocks.find((block) => block.id === id);
        const right = b.blocks.find((block) => block.id === id);
        if (!deepEqual(left, right)) changed.push(id);
        else if (
          a.blocks.findIndex((block) => block.id === id) !==
          b.blocks.findIndex((block) => block.id === id)
        ) {
          changed.push(id);
        }
      }
      return changed;
    },
  };
}

const OPS: Record<EditablePageId, PageContentOps> = {
  home: homeOps,
  about: blockOps("about"),
  "our-craft": blockOps("our-craft"),
  sustainability: blockOps("sustainability"),
  wholesale: blockOps("wholesale"),
  contact: blockOps("contact"),
};

export function pageOps(pageId: EditablePageId): PageContentOps {
  return OPS[pageId];
}

/** True for the homepage, whose document is a keyed set of sections. */
export function isHomePage(pageId: EditablePageId): pageId is "home" {
  return pageId === "home";
}

/** Readable labels for the publish summary and the history panel. */
export function sectionLabels(
  pageId: EditablePageId,
  document: unknown,
): Map<string, string> {
  const labels = new Map<string, string>();
  if (pageId === "home") {
    for (const meta of Object.values(HOMEPAGE_SECTIONS)) labels.set(meta.id, meta.label);
    return labels;
  }
  labels.set("seo", "Search engine listing");
  for (const info of pageOps(pageId).sections(document)) labels.set(info.id, info.label);
  return labels;
}

/** The content a page falls back to before anything is published, for tests and seeds. */
export function fallbackDocument(pageId: EditablePageId, settings: Settings): unknown {
  return pageId === "home"
    ? homepageDefaultsFrom(settings.home)
    : pageDefaults(pageId, settings);
}

export { defaultHomepageContent, type PageDocument };
