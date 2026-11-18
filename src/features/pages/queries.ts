import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { getSiteSettings, SETTINGS_TAG } from "@/features/settings/queries";
import { db } from "@/lib/db";

import { type PageVersion, parsePageHistory } from "./history";
import {
  draftKey,
  type EditablePageId,
  EDITABLE_PAGE_IDS,
  historyKey,
  pageTag,
  publishedKey,
} from "./ids";
import { pageOps } from "./registry";

export type PageRowMeta = { updatedAt: string; updatedBy: string | null };

type Row = { value: unknown; meta: PageRowMeta } | null;

async function readRow(key: string): Promise<Row> {
  const row = await db.siteSetting.findUnique({
    where: { key },
    select: {
      value: true,
      updatedAt: true,
      updatedBy: { select: { name: true, email: true } },
    },
  });
  if (!row) return null;
  return {
    value: row.value,
    meta: {
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: row.updatedBy ? (row.updatedBy.name ?? row.updatedBy.email) : null,
    },
  };
}

/**
 * One page as visitors see it. Cached and tagged per page, so publishing refreshes only
 * that page.
 *
 * Falls back to the content in `src/content/site-content.ts` when nothing is published,
 * the stored document is invalid, or the database is unreachable - a public page never
 * breaks because of this feature.
 */
export async function getPublishedPage(pageId: EditablePageId): Promise<unknown> {
  "use cache";
  cacheLife("minutes");
  // SETTINGS_TAG too: the fallback is seeded from the `home` and `about` settings.
  cacheTag(pageTag(pageId), SETTINGS_TAG);

  const ops = pageOps(pageId);
  const fallback = ops.defaults(await getSiteSettings());
  try {
    const row = await db.siteSetting.findUnique({
      where: { key: publishedKey(pageId) },
      select: { value: true },
    });
    if (!row) return fallback;
    return ops.parse(row.value) ?? fallback;
  } catch (error) {
    console.error(
      `[pages] ${pageId}: falling back to the default content`,
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
}

export type PageEditorData = {
  pageId: EditablePageId;
  /** What the editor opens with: the saved draft, else published, else the defaults. */
  draft: unknown;
  /** What the public page currently shows. */
  published: unknown;
  hasDraft: boolean;
  hasPublished: boolean;
  draftMeta: PageRowMeta | null;
  publishedMeta: PageRowMeta | null;
  history: PageVersion[];
};

/**
 * Everything one page editor needs. Read at request time (never cached) so an admin always
 * sees their own latest save.
 */
export async function getPageEditorData(pageId: EditablePageId): Promise<PageEditorData> {
  const ops = pageOps(pageId);
  const settings = await getSiteSettings();
  const defaults = ops.defaults(settings);

  const [draftRow, publishedRow, historyRow] = await Promise.all([
    readRow(draftKey(pageId)),
    readRow(publishedKey(pageId)),
    readRow(historyKey(pageId)),
  ]);

  const published = publishedRow ? (ops.parse(publishedRow.value) ?? defaults) : defaults;
  const draft = draftRow ? (ops.parse(draftRow.value) ?? published) : published;

  return {
    pageId,
    draft,
    published,
    hasDraft: draftRow !== null,
    hasPublished: publishedRow !== null,
    draftMeta: draftRow?.meta ?? null,
    publishedMeta: publishedRow?.meta ?? null,
    history: historyRow ? parsePageHistory(historyRow.value) : [],
  };
}

export type PageOverview = {
  pageId: EditablePageId;
  hasDraft: boolean;
  hasPublished: boolean;
  /** True when the saved draft differs from what is live. */
  draftDiffers: boolean;
  publishedAt: string | null;
  publishedBy: string | null;
};

/** Status of every editable page, for the /admin/pages list. */
export async function getPagesOverview(): Promise<PageOverview[]> {
  const settings = await getSiteSettings();
  const keys = EDITABLE_PAGE_IDS.flatMap((id) => [draftKey(id), publishedKey(id)]);
  const rows = await db.siteSetting.findMany({
    where: { key: { in: keys } },
    select: {
      key: true,
      value: true,
      updatedAt: true,
      updatedBy: { select: { name: true, email: true } },
    },
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  return EDITABLE_PAGE_IDS.map((pageId) => {
    const ops = pageOps(pageId);
    const defaults = ops.defaults(settings);
    const draftRow = byKey.get(draftKey(pageId));
    const publishedRow = byKey.get(publishedKey(pageId));
    const published = publishedRow
      ? (ops.parse(publishedRow.value) ?? defaults)
      : defaults;
    const draft = draftRow ? (ops.parse(draftRow.value) ?? published) : published;

    return {
      pageId,
      hasDraft: draftRow !== undefined,
      hasPublished: publishedRow !== undefined,
      draftDiffers: ops.changedSections(published, draft).length > 0,
      publishedAt: publishedRow?.updatedAt.toISOString() ?? null,
      publishedBy: publishedRow?.updatedBy
        ? (publishedRow.updatedBy.name ?? publishedRow.updatedBy.email)
        : null,
    };
  });
}
