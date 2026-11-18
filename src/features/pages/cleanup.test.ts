import { describe, expect, it } from "vitest";

import { defaultSettings, type Settings } from "@/features/settings/schema";

import { type PageDocument, setBlockImage } from "./blocks";
import { pageDefaults } from "./defaults";
import {
  addHistoryVersion,
  findVersion,
  PAGE_HISTORY_LIMIT,
  type PageVersion,
  parsePageHistory,
  pageVersionSchema,
} from "./history";
import { EDITABLE_PAGE_IDS, type EditablePageId } from "./ids";
import { pageOps } from "./registry";
import {
  parseUploadRecords,
  planCleanup,
  trackUpload,
  type UploadRecord,
} from "./uploads";

const settings = (): Settings => structuredClone(defaultSettings);
const cloudinaryUrl = (publicId: string) =>
  `https://res.cloudinary.com/kishwour/image/upload/v1731600000/${publicId}.jpg`;
const record = (publicId: string): UploadRecord => ({
  publicId,
  uploadedAt: "2026-11-14T12:00:00.000Z",
});

/** A wholesale document whose hero carries the given asset. */
function wholesaleWith(publicId: string): PageDocument {
  return setBlockImage(pageDefaults("wholesale", settings()), "hero", {
    url: cloudinaryUrl(publicId),
    alt: "Photo",
    publicId,
  });
}

/** An about document whose story section carries the given asset. */
function aboutWith(publicId: string): PageDocument {
  return setBlockImage(pageDefaults("about", settings()), "story", {
    url: cloudinaryUrl(publicId),
    alt: "Photo",
    publicId,
  });
}

/** The reference set the Server Action builds from every page's documents. */
function referencesOf(documents: { pageId: EditablePageId; document: unknown }[]) {
  const ids = new Set<string>();
  for (const entry of documents) {
    for (const image of pageOps(entry.pageId).images(entry.document)) {
      if (image.publicId) ids.add(image.publicId);
    }
  }
  return ids;
}

describe("cross-page image clean-up", () => {
  it("never deletes an image another page still uses", () => {
    const shared = "kishwour/site/shared";
    // Wholesale drops the image, but About still publishes it.
    const referenced = referencesOf([
      { pageId: "wholesale", document: pageDefaults("wholesale", settings()) },
      { pageId: "about", document: aboutWith(shared) },
    ]);
    const plan = planCleanup({
      tracked: [record(shared)],
      replacedIds: new Set([shared]),
      referencedIds: referenced,
    });
    expect(plan.destroy).toEqual([]);
    expect(plan.tracked.map((r) => r.publicId)).toEqual([shared]);
  });

  it("deletes an image once no page references it any more", () => {
    const dropped = "kishwour/site/dropped";
    const referenced = referencesOf(
      EDITABLE_PAGE_IDS.map((pageId) => ({
        pageId,
        document: pageOps(pageId).defaults(settings()),
      })),
    );
    expect(
      planCleanup({
        tracked: [record(dropped)],
        replacedIds: new Set([dropped]),
        referencedIds: referenced,
      }).destroy,
    ).toEqual([dropped]);
  });

  it("keeps an image that only a draft on another page uses", () => {
    const inDraft = "kishwour/site/other-draft";
    expect(
      planCleanup({
        tracked: [record(inDraft)],
        replacedIds: new Set([inDraft]),
        referencedIds: referencesOf([{ pageId: "about", document: aboutWith(inDraft) }]),
      }).destroy,
    ).toEqual([]);
  });

  it("keeps an image a history version of another page references", () => {
    const old = "kishwour/site/old-hero";
    const history: PageVersion[] = [
      {
        id: "v1",
        publishedAt: "2026-11-01T00:00:00.000Z",
        publishedBy: { id: "s1", name: "Admin" },
        changedSections: [],
        document: wholesaleWith(old),
      },
    ];
    const referenced = referencesOf(
      history.map((version) => ({
        pageId: "wholesale" as const,
        document: version.document,
      })),
    );
    expect(
      planCleanup({
        tracked: [record(old)],
        replacedIds: new Set([old]),
        referencedIds: referenced,
      }).destroy,
    ).toEqual([]);
  });

  it("still refuses to touch catalogue media", () => {
    expect(
      planCleanup({
        tracked: [record("kishwour/products/shoe")],
        replacedIds: new Set(["kishwour/categories/jute"]),
        referencedIds: new Set(),
      }).destroy,
    ).toEqual([]);
  });

  it("finds images on the homepage and the block pages alike", () => {
    const home = pageOps("home");
    expect(home.images(home.defaults(settings()))).toEqual([]);
    expect(
      pageOps("wholesale")
        .images(wholesaleWith("kishwour/site/w"))
        .map((i) => i.publicId),
    ).toEqual(["kishwour/site/w"]);
  });
});

describe("upload tracking", () => {
  it("drops unreadable entries", () => {
    expect(
      parseUploadRecords([
        record("kishwour/site/a"),
        { publicId: "" },
        "nope",
        record("kishwour/site/b"),
      ]).map((r) => r.publicId),
    ).toEqual(["kishwour/site/a", "kishwour/site/b"]);
    expect(parseUploadRecords(null)).toEqual([]);
  });

  it("records newest first and de-duplicates", () => {
    const list = trackUpload(
      trackUpload([], "kishwour/site/a", "2026-01-01T00:00:00.000Z"),
      "kishwour/site/b",
      "2026-01-02T00:00:00.000Z",
    );
    expect(trackUpload(list, "kishwour/site/a", "2026-01-03T00:00:00.000Z")).toEqual([
      { publicId: "kishwour/site/a", uploadedAt: "2026-01-03T00:00:00.000Z" },
      { publicId: "kishwour/site/b", uploadedAt: "2026-01-02T00:00:00.000Z" },
    ]);
  });

  it("still fixes the intermediate-upload orphan", () => {
    expect(
      planCleanup({
        tracked: [record("kishwour/site/b"), record("kishwour/site/a")],
        replacedIds: new Set(),
        referencedIds: new Set(["kishwour/site/b"]),
      }).destroy,
    ).toEqual(["kishwour/site/a"]);
  });
});

describe("history and restore, per page", () => {
  const version = (id: string, document: unknown): PageVersion => ({
    id,
    publishedAt: "2026-11-14T10:00:00.000Z",
    publishedBy: { id: "s1", name: "Admin" },
    changedSections: ["header"],
    document,
  });

  it("accepts a snapshot of any page's document", () => {
    for (const pageId of EDITABLE_PAGE_IDS) {
      const document = pageOps(pageId).defaults(settings());
      expect(pageVersionSchema.safeParse(version("v1", document)).success, pageId).toBe(
        true,
      );
    }
  });

  it("keeps the newest ten and reports the ones it dropped", () => {
    let history: PageVersion[] = [];
    const dropped: string[] = [];
    for (let i = 1; i <= 13; i++) {
      const result = addHistoryVersion(history, version(`v${i}`, {}));
      history = result.history;
      dropped.push(...result.dropped.map((v) => v.id));
    }
    expect(history).toHaveLength(PAGE_HISTORY_LIMIT);
    expect(history[0]?.id).toBe("v13");
    expect(dropped).toEqual(["v1", "v2", "v3"]);
  });

  it("drops only unreadable entries", () => {
    expect(
      parsePageHistory([version("v1", {}), { id: "broken" }, version("v2", {})]).map(
        (v) => v.id,
      ),
    ).toEqual(["v1", "v2"]);
    expect(parsePageHistory("nope")).toEqual([]);
  });

  it("restores a version into a document the page accepts", () => {
    const original = pageDefaults("about", settings());
    const history = [version("v1", original)];
    const found = findVersion(history, "v1");
    expect(found).not.toBeNull();
    expect(pageOps("about").parse(found?.document)).not.toBeNull();
    expect(findVersion(history, "nope")).toBeNull();
  });

  it("refuses to restore a version that belongs to another page", () => {
    const homeDocument = pageOps("home").defaults(settings());
    expect(pageOps("about").parse(version("v1", homeDocument).document)).toBeNull();
  });
});
