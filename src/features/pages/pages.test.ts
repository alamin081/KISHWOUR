import { describe, expect, it } from "vitest";

import {
  aboutContent,
  craftContent,
  homeContent,
  sustainabilityContent,
  wholesaleContent,
} from "@/content/site-content";
import { defaultSettings, type Settings } from "@/features/settings/schema";

import {
  applyBlockValues,
  blockAcceptsImage,
  blockImage,
  findBlock,
  MAX_BLOCK_ITEMS,
  MAX_BLOCKS,
  moveBlock,
  type PageDocument,
  pageDocumentImages,
  pageDocumentSchema,
  parsePageDocument,
  SEO_DESCRIPTION_MAX,
  SEO_TITLE_MAX,
  setBlockImage,
  setBlockVisibility,
} from "./blocks";
import { type BlockPageId, pageDefaults } from "./defaults";
import {
  allContentKeys,
  draftKey,
  EDITABLE_PAGE_IDS,
  historyKey,
  isEditablePageId,
  pageTag,
  publishedKey,
  UPLOADS_KEY,
} from "./ids";
import { pageOps } from "./registry";

const BLOCK_PAGES: BlockPageId[] = [
  "about",
  "our-craft",
  "sustainability",
  "wholesale",
  "contact",
];

const settings = (): Settings => structuredClone(defaultSettings);

const cloudinaryUrl = (publicId: string) =>
  `https://res.cloudinary.com/kishwour/image/upload/v1731600000/${publicId}.jpg`;

describe("storage keys", () => {
  it("keeps the homepage on the keys it has always used", () => {
    expect(draftKey("home")).toBe("homepage.draft");
    expect(publishedKey("home")).toBe("homepage.published");
    expect(historyKey("home")).toBe("homepage.history");
    expect(pageTag("home")).toBe("site:homepage");
  });

  it("namespaces every other page", () => {
    expect(draftKey("about")).toBe("page.about.draft");
    expect(publishedKey("our-craft")).toBe("page.our-craft.published");
    expect(historyKey("wholesale")).toBe("page.wholesale.history");
    expect(pageTag("contact")).toBe("site:page:contact");
  });

  it("gives every page three distinct keys and one shared upload list", () => {
    const keys = allContentKeys();
    expect(keys).toHaveLength(EDITABLE_PAGE_IDS.length * 3);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain(UPLOADS_KEY);
  });

  it("recognises only real page IDs", () => {
    for (const id of EDITABLE_PAGE_IDS) expect(isEditablePageId(id)).toBe(true);
    for (const id of ["", "Home", "products", null, 3, {}])
      expect(isEditablePageId(id)).toBe(false);
  });
});

describe("page defaults", () => {
  it("every page has a valid default document", () => {
    for (const pageId of BLOCK_PAGES) {
      const parsed = pageDocumentSchema.safeParse(pageDefaults(pageId, settings()));
      expect(parsed.success, pageId).toBe(true);
    }
  });

  it("uses unique block IDs and stays inside the block limit", () => {
    for (const pageId of BLOCK_PAGES) {
      const { blocks } = pageDefaults(pageId, settings());
      expect(new Set(blocks.map((b) => b.id)).size, pageId).toBe(blocks.length);
      expect(blocks.length).toBeLessThanOrEqual(MAX_BLOCKS);
    }
  });

  it("starts with every block visible, so nothing disappears", () => {
    for (const pageId of BLOCK_PAGES) {
      expect(
        pageDefaults(pageId, settings()).blocks.every((block) => block.visible),
        pageId,
      ).toBe(true);
    }
  });

  it("mirrors the About content, seeded from the saved about setting", () => {
    const document = pageDefaults("about", settings());
    const header = findBlock(document, "header");
    expect(header).toMatchObject({
      type: "header",
      eyebrow: "About Us",
      title: aboutContent.intro.title,
      description: defaultSettings.about.introDescription,
    });
    // One editorial block per saved section, in the same order and with the same IDs.
    expect(
      document.blocks.filter((b) => b.type === "editorial").map((b) => b.id),
    ).toEqual(defaultSettings.about.sections.map((s) => s.id));
    expect(findBlock(document, "story")).toMatchObject({
      mediaLabel: "Brand photography",
      reverse: false,
      tone: "muted",
    });
    expect(findBlock(document, "craftsmanship")).toMatchObject({
      mediaLabel: "Craft photography",
      reverse: true,
    });
  });

  it("seeds About from whatever the old admin form saved", () => {
    const edited = settings();
    edited.about.introDescription = "Saved intro";
    edited.about.sections = [
      {
        id: "introduction",
        eyebrow: "Saved label",
        title: "Saved title",
        body: "Saved body",
      },
    ];
    const document = pageDefaults("about", edited);
    expect(findBlock(document, "header")).toMatchObject({ description: "Saved intro" });
    expect(findBlock(document, "introduction")).toMatchObject({
      eyebrow: "Saved label",
      title: "Saved title",
      body: "Saved body",
    });
    expect(document.blocks.filter((b) => b.type === "editorial")).toHaveLength(1);
  });

  it("mirrors the Our Craft content, keeping the #process and #quality anchors", () => {
    const document = pageDefaults("our-craft", settings());
    expect(findBlock(document, "process")).toMatchObject({
      type: "steps",
      tone: "dark",
      centered: false,
    });
    expect(
      findBlock(document, "process")?.type === "steps" && findBlock(document, "process"),
    ).toMatchObject({
      items: craftContent.process.map((step, i) => ({
        id: `process-${i + 1}`,
        title: step.title,
        text: step.text,
      })),
    });
    expect(findBlock(document, "quality")).toMatchObject({
      type: "callout",
      title: craftContent.quality.title,
      text: craftContent.quality.body,
    });
    expect(findBlock(document, "handmade")).toMatchObject({
      mediaLabel: "Craft photography",
    });
  });

  it("mirrors the Sustainability content and starts with no claims", () => {
    const document = pageDefaults("sustainability", settings());
    expect(findBlock(document, "verified")).toMatchObject({
      type: "claims",
      items: [],
    });
    expect(findBlock(document, "claims-policy")).toMatchObject({
      type: "note",
      text: sustainabilityContent.claimsPolicy,
    });
    expect(findBlock(document, "jute")).toMatchObject({
      mediaLabel: "Material photography",
      reverse: true,
    });
  });

  it("mirrors the Wholesale content and keeps the #custom-manufacturing anchor", () => {
    const document = pageDefaults("wholesale", settings());
    expect(findBlock(document, "hero")).toMatchObject({
      type: "hero",
      title: wholesaleContent.intro.title,
      image: null,
    });
    expect(findBlock(document, "offerings")).toMatchObject({
      type: "cards",
      items: wholesaleContent.offerings.map((o) => ({
        id: o.id,
        title: o.title,
        text: o.text,
      })),
    });
    const oem = findBlock(document, "custom-manufacturing");
    expect(oem).toMatchObject({
      type: "checklist",
      title: homeContent.customManufacturing.title,
      items: [...homeContent.customManufacturing.options],
    });
  });

  it("gives Contact only its heading - details stay with the contact setting", () => {
    const document = pageDefaults("contact", settings());
    expect(document.blocks).toHaveLength(1);
    expect(document.blocks[0]).toMatchObject({ id: "header", type: "header" });
  });
});

describe("SEO fields", () => {
  it("every page ships a title and description within the limits", () => {
    for (const pageId of BLOCK_PAGES) {
      const { seo } = pageDefaults(pageId, settings());
      expect(seo.title.length, pageId).toBeGreaterThan(0);
      expect(seo.title.length).toBeLessThanOrEqual(SEO_TITLE_MAX);
      expect(seo.description.length).toBeLessThanOrEqual(SEO_DESCRIPTION_MAX);
    }
  });

  it("rejects over-long values", () => {
    const document = pageDefaults("about", settings());
    expect(
      pageDocumentSchema.safeParse({
        ...document,
        seo: { title: "x".repeat(SEO_TITLE_MAX + 1), description: "" },
      }).success,
    ).toBe(false);
    expect(
      pageDocumentSchema.safeParse({
        ...document,
        seo: { title: "", description: "x".repeat(SEO_DESCRIPTION_MAX + 1) },
      }).success,
    ).toBe(false);
  });

  it("accepts empty SEO fields - the page heading is then used", () => {
    const document = pageDefaults("about", settings());
    expect(
      pageDocumentSchema.safeParse({ ...document, seo: { title: "", description: "" } })
        .success,
    ).toBe(true);
  });
});

describe("pageDocumentSchema", () => {
  const base = () => pageDefaults("about", settings());

  it("rejects anything that is not a document", () => {
    for (const value of [null, undefined, 0, "", "{}", [], {}, { blocks: [] }]) {
      expect(parsePageDocument(value)).toBeNull();
    }
  });

  it("requires block headings and reports the field path", () => {
    const document = base();
    const broken = {
      ...document,
      blocks: document.blocks.map((block, i) =>
        i === 0 ? { ...block, title: "  " } : block,
      ),
    };
    const parsed = pageDocumentSchema.safeParse(broken);
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.path).toEqual(["blocks", 0, "title"]);
  });

  it("rejects duplicate block IDs", () => {
    const document = base();
    const first = document.blocks[0];
    if (!first) throw new Error("no blocks");
    const parsed = pageDocumentSchema.safeParse({
      ...document,
      blocks: [...document.blocks, { ...first }],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an unknown block type", () => {
    const document = base();
    expect(
      pageDocumentSchema.safeParse({
        ...document,
        blocks: [{ id: "x", type: "marquee", visible: true }],
      }).success,
    ).toBe(false);
  });

  it("caps list items", () => {
    const document = pageDefaults("wholesale", settings());
    const tooMany = document.blocks.map((block) =>
      block.type === "cards"
        ? {
            ...block,
            items: Array.from({ length: MAX_BLOCK_ITEMS + 1 }, (_, i) => ({
              id: `i${i}`,
              title: "t",
              text: "x",
            })),
          }
        : block,
    );
    expect(pageDocumentSchema.safeParse({ ...document, blocks: tooMany }).success).toBe(
      false,
    );
  });

  it("only accepts Cloudinary images with alt text", () => {
    const document = pageDefaults("wholesale", settings());
    const withForeign = setBlockImage(document, "hero", {
      url: "https://evil.example/photo.jpg",
      alt: "Photo",
      publicId: "",
    });
    expect(pageDocumentSchema.safeParse(withForeign).success).toBe(false);

    const withoutAlt = setBlockImage(document, "hero", {
      url: cloudinaryUrl("kishwour/site/w"),
      alt: "  ",
      publicId: "kishwour/site/w",
    });
    expect(pageDocumentSchema.safeParse(withoutAlt).success).toBe(false);

    const good = setBlockImage(document, "hero", {
      url: cloudinaryUrl("kishwour/site/w"),
      alt: "Jute bags",
      publicId: "kishwour/site/w",
    });
    expect(pageDocumentSchema.safeParse(good).success).toBe(true);
  });
});

describe("block operations", () => {
  const document = (): PageDocument => pageDefaults("our-craft", settings());

  it("hides and shows one block only", () => {
    const hidden = setBlockVisibility(document(), "process", false);
    expect(findBlock(hidden, "process")?.visible).toBe(false);
    expect(findBlock(hidden, "header")?.visible).toBe(true);
    expect(findBlock(document(), "process")?.visible).toBe(true);
  });

  it("moves a block and leaves the ends alone", () => {
    const start = document();
    const ids = start.blocks.map((b) => b.id);
    const moved = moveBlock(start, "quality", -1);
    const movedIds = moved.blocks.map((b) => b.id);
    expect(movedIds.indexOf("quality")).toBe(ids.indexOf("quality") - 1);
    const firstId = ids[0];
    const lastId = ids[ids.length - 1];
    if (!firstId || !lastId) throw new Error("no blocks");
    expect(moveBlock(start, firstId, -1)).toBe(start);
    expect(moveBlock(start, lastId, 1)).toBe(start);
  });

  it("merges panel values into one block without losing its identity", () => {
    const next = applyBlockValues(document(), "quality", { title: "New heading" });
    expect(findBlock(next, "quality")).toMatchObject({
      id: "quality",
      type: "callout",
      visible: true,
      title: "New heading",
    });
    expect(pageDocumentSchema.safeParse(next).success).toBe(true);
  });

  it("only offers an image where the layout has a slot", () => {
    const craft = document();
    const handmade = findBlock(craft, "handmade");
    const materials = findBlock(craft, "materials");
    const process = findBlock(craft, "process");
    expect(handmade && blockAcceptsImage(handmade)).toBe(true);
    expect(materials && blockAcceptsImage(materials)).toBe(false);
    expect(process && blockAcceptsImage(process)).toBe(false);
    expect(
      blockAcceptsImage(findBlock(pageDefaults("wholesale", settings()), "hero")!),
    ).toBe(true);
  });

  it("sets and clears a block image", () => {
    const image = {
      url: cloudinaryUrl("kishwour/site/craft"),
      alt: "Craft",
      publicId: "kishwour/site/craft",
    };
    const withImage = setBlockImage(document(), "handmade", image);
    expect(blockImage(withImage, "handmade")).toEqual(image);
    expect(blockImage(setBlockImage(withImage, "handmade", null), "handmade")).toBeNull();
    // A block with no image slot is left untouched.
    expect(blockImage(setBlockImage(document(), "process", image), "process")).toBeNull();
  });

  it("collects every image a document references", () => {
    let document_ = pageDefaults("sustainability", settings());
    expect(pageDocumentImages(document_)).toEqual([]);
    document_ = setBlockImage(document_, "jute", {
      url: cloudinaryUrl("kishwour/site/jute"),
      alt: "Jute",
      publicId: "kishwour/site/jute",
    });
    expect(pageDocumentImages(document_).map((i) => i.publicId)).toEqual([
      "kishwour/site/jute",
    ]);
    expect(pageDocumentImages(null)).toEqual([]);
  });
});

describe("page operations through the registry", () => {
  it("reports the sections of each page in order", () => {
    for (const pageId of EDITABLE_PAGE_IDS) {
      const ops = pageOps(pageId);
      const document = ops.defaults(settings());
      const ids = ops.sectionIds(document);
      expect(ids.length, pageId).toBeGreaterThan(0);
      expect(ops.sections(document).map((s) => s.id)).toEqual(ids);
    }
  });

  it("validates its own page and rejects another page's document", () => {
    const about = pageOps("about").defaults(settings());
    expect(pageOps("about").parse(about)).not.toBeNull();
    expect(pageOps("home").parse(about)).toBeNull();

    const home = pageOps("home").defaults(settings());
    expect(pageOps("home").parse(home)).not.toBeNull();
    expect(pageOps("about").parse(home)).toBeNull();
  });

  it("lists the sections that changed between two documents", () => {
    const ops = pageOps("about");
    const before = ops.defaults(settings()) as PageDocument;
    const after = applyBlockValues(before, "story", { title: "Changed" });
    expect(ops.changedSections(before, after)).toEqual(["story"]);
    expect(ops.changedSections(before, before)).toEqual([]);
  });

  it("notices SEO and ordering changes", () => {
    const ops = pageOps("about");
    const before = ops.defaults(settings()) as PageDocument;
    expect(
      ops.changedSections(before, { ...before, seo: { title: "New", description: "" } }),
    ).toContain("seo");
    expect(
      ops.changedSections(before, moveBlock(before, "story", 1)).length,
    ).toBeGreaterThan(0);
  });

  it("finds images for every page, including the homepage", () => {
    const home = pageOps("home");
    expect(home.images(home.defaults(settings()))).toEqual([]);
    const wholesale = pageOps("wholesale");
    const document = setBlockImage(
      wholesale.defaults(settings()) as PageDocument,
      "hero",
      { url: cloudinaryUrl("kishwour/site/w"), alt: "W", publicId: "kishwour/site/w" },
    );
    expect(wholesale.images(document).map((i) => i.publicId)).toEqual([
      "kishwour/site/w",
    ]);
  });
});
