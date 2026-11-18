"use client";

import { type ReactNode } from "react";

import { HomepageSection, type HomepageRenderData } from "@/components/homepage/sections";
import { PageBlockView, type PageRenderData } from "@/components/pages/blocks";
import { deepEqual } from "@/features/pages/compare";
import {
  applyBlockValues,
  blockImage,
  findBlock,
  moveBlock,
  type PageDocument,
  parsePageDocument,
  setBlockImage,
  setBlockVisibility,
} from "@/features/pages/blocks";
import { changedSectionIds, sameHomepageContent } from "@/features/homepage/compare";
import { type ImageFrameAspects } from "@/features/homepage/image-display";
import {
  applySectionValues,
  type HomepageContent,
  type HomepageImage,
  type HomepageImageSectionId,
  moveSection,
  parseHomepageContent,
  sectionHasImage,
  sectionImage,
  setSectionImage,
  setSectionVisibility,
} from "@/features/homepage/schema";
import { type EditablePageId } from "@/features/pages/ids";
import { type PageSectionInfo, pageOps } from "@/features/pages/registry";
import {
  type HomepageSectionId,
  isHomepageSectionId,
} from "@/features/homepage/sections";

import { BlockForm } from "./blocks/block-forms";
import { SectionFields } from "./home/section-fields";

/**
 * Per-page glue for the shared editor shell: how to read and change a document, how to
 * render one section in the preview and which fields its edit panel shows.
 *
 * Two implementations - the homepage's keyed sections and the block documents behind the
 * other pages - behind one interface, so the shell stays page-agnostic.
 */

export type PreviewBundle = {
  /** Only built for the homepage, which previews real categories and products. */
  home: HomepageRenderData | null;
  page: PageRenderData;
};

export type EditorAdapter<T> = {
  parse(value: unknown): T | null;
  same(a: T, b: T): boolean;
  changedSections(a: T, b: T): string[];
  sections(content: T): PageSectionInfo[];
  setVisible(content: T, id: string, visible: boolean): T;
  move(content: T, id: string, direction: -1 | 1): T;
  image(content: T, id: string): HomepageImage | null;
  imageLabel(content: T, id: string): string;
  /** Testimonial portraits are round; section photos are not. */
  imagePortrait(content: T, id: string): boolean;
  /** Default container aspect ratios (width / height) per device for the section's photo. */
  imageAspects(content: T, id: string): ImageFrameAspects;
  /** Server field error for the section's image (URL or alt text), if any. */
  imageError(content: T, id: string, serverErrors: Record<string, string>): string | undefined;
  setImage(content: T, id: string, image: HomepageImage | null): T;
  labels(content: T): Map<string, string>;
  renderSection(content: T, id: string, data: PreviewBundle): ReactNode;
  renderForm(args: {
    content: T;
    id: string;
    serverErrors: Record<string, string>;
    cloudinaryConfigured: boolean;
    onChange: (updater: T | ((prev: T) => T)) => void;
  }): ReactNode;
  /** Page-level SEO, where the page has it. */
  seo: {
    get(content: T): { title: string; description: string };
    set(content: T, seo: { title: string; description: string }): T;
  } | null;
};

/* ------------------------------------------------------------------- home */

const HOME_IMAGE_LABELS: Record<HomepageImageSectionId, string> = {
  hero: "Lifestyle photography",
  about: "Brand photography",
  craft: "Craft photography",
  sustainability: "Material photography",
};

const HOME_IMAGE_ASPECTS: Record<HomepageImageSectionId, ImageFrameAspects> = {
  hero: { desktop: 4 / 5, mobile: 4 / 5 },
  about: { desktop: 4 / 3, mobile: 4 / 3 },
  craft: { desktop: 4 / 3, mobile: 4 / 3 },
  sustainability: { desktop: 4 / 3, mobile: 4 / 3 },
};

const DEFAULT_BLOCK_ASPECTS: ImageFrameAspects = {
  desktop: 4 / 3,
  mobile: 4 / 3,
};

const homeAdapter: EditorAdapter<HomepageContent> = {
  parse: parseHomepageContent,
  same: sameHomepageContent,
  changedSections: (a, b) => changedSectionIds(a, b),
  sections: (content) => pageOps("home").sections(content),
  setVisible: (content, id, visible) =>
    isHomepageSectionId(id) ? setSectionVisibility(content, id, visible) : content,
  move: (content, id, direction) =>
    isHomepageSectionId(id) ? moveSection(content, id, direction) : content,
  image: (content, id) => (isHomepageSectionId(id) ? sectionImage(content, id) : null),
  imageLabel: (_content, id) =>
    isHomepageSectionId(id) && sectionHasImage(id)
      ? HOME_IMAGE_LABELS[id]
      : "Photography",
  imagePortrait: () => false,
  imageAspects: (_content, id) =>
    isHomepageSectionId(id) && sectionHasImage(id)
      ? HOME_IMAGE_ASPECTS[id]
      : DEFAULT_BLOCK_ASPECTS,
  imageError: (_content, id, serverErrors) =>
    serverErrors[`${id}.image.alt`] ??
    serverErrors[`${id}.image.url`] ??
    serverErrors[`${id}.image`],
  setImage: (content, id, image) =>
    isHomepageSectionId(id) && sectionHasImage(id)
      ? setSectionImage(content, id as HomepageImageSectionId, image)
      : content,
  labels: (content) => {
    const labels = new Map<string, string>();
    for (const info of pageOps("home").sections(content)) labels.set(info.id, info.label);
    return labels;
  },
  renderSection: (content, id, data) =>
    data.home && isHomepageSectionId(id) ? (
      <HomepageSection id={id} content={content} data={data.home} preview />
    ) : null,
  renderForm: ({ content, id, serverErrors, cloudinaryConfigured, onChange }) =>
    isHomepageSectionId(id) ? (
      <SectionFields
        key={id}
        id={id}
        content={content}
        serverErrors={scoped(serverErrors, id)}
        cloudinaryConfigured={cloudinaryConfigured}
        onChangeSection={(sectionId, values) =>
          onChange((prev) => applySectionValues(prev, sectionId, values))
        }
      />
    ) : null,
  seo: null,
};

/* ------------------------------------------------------------ block pages */

function blockAdapter(
  pageId: Exclude<EditablePageId, "home">,
): EditorAdapter<PageDocument> {
  const ops = pageOps(pageId);
  return {
    parse: parsePageDocument,
    same: (a, b) => deepEqual(a, b),
    changedSections: (a, b) => ops.changedSections(a, b),
    sections: (content) => ops.sections(content),
    setVisible: setBlockVisibility,
    move: moveBlock,
    image: blockImage,
    imageLabel: (content, id) => {
      const block = findBlock(content, id);
      if (block?.type === "hero") return "Wholesale photography";
      if (block?.type === "editorial" && block.mediaLabel) return block.mediaLabel;
      return "Photography";
    },
    imagePortrait: () => false,
    imageAspects: () => DEFAULT_BLOCK_ASPECTS,
    imageError: (content, id, serverErrors) => {
      const errs = blockErrors(serverErrors, content, id);
      return errs["image.alt"] ?? errs["image.url"] ?? errs["image"];
    },
    setImage: setBlockImage,
    labels: (content) => {
      const labels = new Map<string, string>([["seo", "Search engine listing"]]);
      for (const info of ops.sections(content)) labels.set(info.id, info.label);
      return labels;
    },
    renderSection: (content, id, data) => {
      const block = findBlock(content, id);
      return block ? <PageBlockView block={block} data={data.page} preview /> : null;
    },
    renderForm: ({ content, id, serverErrors, onChange }) => {
      const block = findBlock(content, id);
      if (!block) return null;
      return (
        <BlockForm
          key={block.id}
          block={block}
          serverErrors={blockErrors(serverErrors, content, id)}
          onChange={(values) => onChange((prev) => applyBlockValues(prev, id, values))}
        />
      );
    },
    seo: {
      get: (content) => content.seo,
      set: (content, seo) => ({ ...content, seo }),
    },
  };
}

/** Server field errors for one homepage section, with the section prefix stripped. */
function scoped(
  serverErrors: Record<string, string>,
  id: HomepageSectionId,
): Record<string, string> {
  const prefix = `${id}.`;
  const out: Record<string, string> = {};
  for (const [key, message] of Object.entries(serverErrors)) {
    if (key.startsWith(prefix)) out[key.slice(prefix.length)] = message;
  }
  return out;
}

/** Server field errors arrive as `blocks.<index>.<field>`; map them to this block. */
function blockErrors(
  serverErrors: Record<string, string>,
  content: PageDocument,
  id: string,
): Record<string, string> {
  const index = content.blocks.findIndex((block) => block.id === id);
  if (index < 0) return {};
  const prefix = `blocks.${index}.`;
  const out: Record<string, string> = {};
  for (const [key, message] of Object.entries(serverErrors)) {
    if (key.startsWith(prefix)) out[key.slice(prefix.length)] = message;
  }
  return out;
}

export { homeAdapter, blockAdapter };
