import "server-only";

import { type PageRenderData } from "@/components/pages/blocks";
import { getPublishedHomepage } from "@/features/homepage/queries";
import { getSiteSettings } from "@/features/settings/queries";

import { type PageDocument, parsePageDocument } from "./blocks";
import { pageDefaults } from "./defaults";
import { EDITABLE_PAGES, type EditablePageId } from "./ids";
import { getPublishedPage } from "./queries";

/**
 * Everything a public block page needs: its published document and the data the blocks
 * render around it. One call per page keeps the page files small.
 */
export async function getPublicPage(
  pageId: Exclude<EditablePageId, "home">,
): Promise<{ document: PageDocument; data: PageRenderData }> {
  const [published, settings, homepage] = await Promise.all([
    getPublishedPage(pageId),
    getSiteSettings(),
    getPublishedHomepage(),
  ]);

  const meta = EDITABLE_PAGES[pageId];
  const document = parsePageDocument(published) ?? pageDefaults(pageId, settings);
  const whatsapp = settings.contact.whatsapp;

  return {
    document,
    data: {
      breadcrumb: { label: meta.label, href: meta.path },
      contact: {
        title: homepage.contact.title,
        text: homepage.contact.text,
        primaryCtaLabel: homepage.contact.primaryCtaLabel,
        secondaryCtaLabel: homepage.contact.secondaryCtaLabel,
        whatsappLabel: homepage.contact.whatsappLabel,
      },
      ...(whatsapp ? { whatsapp } : {}),
    },
  };
}

/** Metadata built from the page's own SEO fields, falling back to its heading. */
export async function getPublicPageMetadata(
  pageId: Exclude<EditablePageId, "home">,
): Promise<{ title: string; description: string | undefined }> {
  const settings = await getSiteSettings();
  const document =
    parsePageDocument(await getPublishedPage(pageId)) ?? pageDefaults(pageId, settings);
  const heading = document.blocks.find(
    (block) => block.type === "header" || block.type === "hero",
  );
  return {
    title:
      document.seo.title ||
      (heading && "title" in heading ? heading.title : EDITABLE_PAGES[pageId].label),
    description: document.seo.description || undefined,
  };
}
