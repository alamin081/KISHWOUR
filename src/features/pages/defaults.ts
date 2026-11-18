import {
  aboutContent,
  craftContent,
  homeContent,
  sustainabilityContent,
  wholesaleContent,
} from "@/content/site-content";
import { type Settings } from "@/features/settings/schema";

import { type PageBlock, type PageDocument } from "./blocks";
import { type EditablePageId } from "./ids";

/**
 * Defaults for every editable page, built from the content that is live today
 * (`src/content/site-content.ts`, plus the saved `about` setting where one exists).
 *
 * These are what the public pages render until an admin publishes, so every block mirrors
 * the current markup exactly - including which sections show a photo slot, their labels,
 * the alternating backgrounds and the anchor IDs other pages link to.
 */

/** Blocks with no parameters beyond visibility. */
const cta = (bordered: boolean): PageBlock => ({
  id: "cta",
  type: "cta",
  visible: true,
  bordered,
});

/** Paragraph arrays are stored as one textarea value, blank line between paragraphs. */
const joinParagraphs = (body: readonly string[] | string): string =>
  typeof body === "string" ? body : body.join("\n\n");

/** The editorial backgrounds alternate by position, as the current pages do. */
const toneFor = (index: number): "default" | "muted" =>
  index % 2 === 1 ? "muted" : "default";

function aboutDefaults(settings: Settings): PageDocument {
  // The old /admin/content form wrote these; keep whatever it saved.
  const sections = settings.about.sections;
  return {
    seo: { title: "About Us", description: aboutContent.intro.description },
    blocks: [
      {
        id: "header",
        type: "header",
        visible: true,
        eyebrow: "About Us",
        title: aboutContent.intro.title,
        description: settings.about.introDescription,
      },
      ...sections.map<PageBlock>((section, index) => ({
        id: section.id,
        type: "editorial",
        visible: true,
        eyebrow: section.eyebrow,
        title: section.title,
        body: section.body,
        mediaLabel:
          section.id === "story"
            ? "Brand photography"
            : section.id === "craftsmanship"
              ? "Craft photography"
              : "",
        image: null,
        reverse: section.id === "craftsmanship",
        tone: toneFor(index),
      })),
      cta(true),
    ],
  };
}

function ourCraftDefaults(): PageDocument {
  return {
    seo: { title: "Our Craft", description: craftContent.intro.description },
    blocks: [
      {
        id: "header",
        type: "header",
        visible: true,
        eyebrow: "Our Craft",
        title: craftContent.intro.title,
        description: craftContent.intro.description,
      },
      ...craftContent.sections.map<PageBlock>((section, index) => ({
        id: section.id,
        type: "editorial",
        visible: true,
        eyebrow: "",
        title: section.title,
        body: joinParagraphs(section.body),
        mediaLabel: index === 0 ? "Craft photography" : "",
        image: null,
        reverse: false,
        tone: toneFor(index),
      })),
      {
        id: "process",
        type: "steps",
        visible: true,
        eyebrow: "Manufacturing process",
        title: "From specification to dispatch",
        centered: false,
        tone: "dark",
        items: craftContent.process.map((step, index) => ({
          id: `process-${index + 1}`,
          title: step.title,
          text: step.text,
        })),
      },
      {
        id: "quality",
        type: "callout",
        visible: true,
        title: craftContent.quality.title,
        text: craftContent.quality.body,
      },
      cta(true),
    ],
  };
}

function sustainabilityDefaults(): PageDocument {
  return {
    seo: {
      title: "Sustainability",
      description: sustainabilityContent.intro.description,
    },
    blocks: [
      {
        id: "header",
        type: "header",
        visible: true,
        eyebrow: "Sustainability",
        title: sustainabilityContent.intro.title,
        description: sustainabilityContent.intro.description,
      },
      ...sustainabilityContent.sections.map<PageBlock>((section, index) => ({
        id: section.id,
        type: "editorial",
        visible: true,
        eyebrow: "",
        title: section.title,
        body: joinParagraphs(section.body),
        mediaLabel: index === 1 ? "Material photography" : "",
        image: null,
        reverse: index === 1,
        tone: toneFor(index),
      })),
      {
        id: "verified",
        type: "claims",
        visible: true,
        title: "Verified commitments",
        // Empty on purpose: a claim may only be published once it can be evidenced.
        items: [],
      },
      {
        id: "claims-policy",
        type: "note",
        visible: true,
        text: sustainabilityContent.claimsPolicy,
      },
      cta(false),
    ],
  };
}

function wholesaleDefaults(): PageDocument {
  const oem = homeContent.customManufacturing;
  return {
    seo: { title: "Wholesale", description: wholesaleContent.intro.description },
    blocks: [
      {
        id: "hero",
        type: "hero",
        visible: true,
        eyebrow: wholesaleContent.intro.eyebrow,
        title: wholesaleContent.intro.title,
        description: wholesaleContent.intro.description,
        primaryCtaLabel: "Request a Quote",
        secondaryCtaLabel: "Browse the catalogue",
        image: null,
      },
      {
        id: "offerings",
        type: "cards",
        visible: true,
        eyebrow: "For business buyers",
        title: "How we can work together",
        description: "",
        items: wholesaleContent.offerings.map((offering) => ({
          id: offering.id,
          title: offering.title,
          text: offering.text,
        })),
      },
      {
        // The ID is the #custom-manufacturing anchor other pages link to.
        id: "custom-manufacturing",
        type: "checklist",
        visible: true,
        eyebrow: oem.eyebrow,
        title: oem.title,
        text: oem.text,
        ctaLabel: "Start a custom request",
        items: [...oem.options],
        tone: "muted",
      },
      {
        id: "steps",
        type: "steps",
        visible: true,
        eyebrow: "Process",
        title: "From inquiry to export",
        centered: true,
        tone: "default",
        items: wholesaleContent.steps.map((step, index) => ({
          id: `step-${index + 1}`,
          title: step.title,
          text: step.text,
        })),
      },
      cta(true),
    ],
  };
}

function contactDefaults(): PageDocument {
  return {
    seo: {
      title: "Contact",
      description:
        "Contact Kishwour about wholesale orders, custom manufacturing or general questions.",
    },
    blocks: [
      {
        id: "header",
        type: "header",
        visible: true,
        eyebrow: "Contact",
        title: "Get in touch",
        description:
          "Questions about our products, wholesale or custom manufacturing? Send us a message.",
      },
    ],
  };
}

/** Pages driven by the block model (everything except the homepage). */
export type BlockPageId = Exclude<EditablePageId, "home">;

const BUILDERS: Record<BlockPageId, (settings: Settings) => PageDocument> = {
  about: aboutDefaults,
  "our-craft": ourCraftDefaults,
  sustainability: sustainabilityDefaults,
  wholesale: wholesaleDefaults,
  contact: contactDefaults,
};

/** The default document for one page, seeded from today's content. */
export function pageDefaults(pageId: BlockPageId, settings: Settings): PageDocument {
  return BUILDERS[pageId](settings);
}
