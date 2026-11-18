"use server";

import { revalidatePath, updateTag } from "next/cache";

import {
  type ActionResult,
  failure,
  fieldErrorsFrom,
} from "@/features/admin/action-result";
import { isSiteUpload } from "@/features/homepage/cleanup";
import { isCloudinaryDeliveryUrlFor } from "@/features/homepage/image-url";
import { homepageContentSchema } from "@/features/homepage/schema";
import { getSiteSettings } from "@/features/settings/queries";
import { type Prisma } from "@/generated/prisma/client";
import { assertPermission, type StaffUser } from "@/lib/auth/session";
import { destroyCloudinaryAsset, getCloudinaryConfig } from "@/lib/cloudinary";
import { db } from "@/lib/db";

import { pageDocumentSchema } from "./blocks";
import {
  addHistoryVersion,
  findVersion,
  newVersionId,
  type PageVersion,
  parsePageHistory,
} from "./history";
import {
  draftKey,
  type EditablePageId,
  EDITABLE_PAGE_IDS,
  EDITABLE_PAGES,
  historyKey,
  isEditablePageId,
  LEGACY_HOMEPAGE_UPLOADS_KEY,
  pageTag,
  publishedKey,
  UPLOADS_KEY,
} from "./ids";
import { PAGE_PERMISSION } from "./permission";
import { pageOps } from "./registry";
import {
  parseUploadRecords,
  planCleanup,
  trackUpload,
  type UploadRecord,
} from "./uploads";

export type SaveResult = ActionResult<{ updatedAt: string }>;
export type PublishResult = ActionResult<{
  updatedAt: string;
  imageCleanupFailures: number;
  version: PageVersion;
}>;
export type RestoreResult = ActionResult<{ document: unknown }>;

const INVALID: Omit<Extract<ActionResult, { ok: false }>, "fieldErrors"> = {
  ok: false,
  message: "Please correct the highlighted fields.",
};

function unknownPage(): Extract<ActionResult, { ok: false }> {
  return { ok: false, message: "Unknown page." };
}

/**
 * Second gate on image URLs: the shared schema only checks that a URL is a Cloudinary
 * delivery URL (that rule has to run in the browser too). Here the URL is additionally
 * pinned to our own cloud, so content can never point at a third-party Cloudinary account.
 */
function rejectForeignImages(pageId: EditablePageId, document: unknown): string | null {
  const config = getCloudinaryConfig();
  if (!config) return null; // Uploads are disabled; the host-level check already applied.
  for (const image of pageOps(pageId).images(document)) {
    if (!isCloudinaryDeliveryUrlFor(image.url, config.cloudName)) {
      return "Images must be uploaded here - external image URLs are not accepted.";
    }
  }
  return null;
}

function validate(
  pageId: EditablePageId,
  input: unknown,
):
  | { ok: true; document: unknown }
  | { ok: false; result: Extract<SaveResult, { ok: false }> } {
  const ops = pageOps(pageId);
  // The page's own Zod schema; `parse` returns null for anything invalid.
  const document = ops.parse(input);
  if (document === null) {
    const issues = describeIssues(pageId, input);
    return {
      ok: false,
      result: { ...INVALID, ...(issues ? { fieldErrors: issues } : {}) },
    };
  }
  const foreign = rejectForeignImages(pageId, document);
  if (foreign) return { ok: false, result: { ok: false, message: foreign } };
  return { ok: true, document };
}

/** Field-level messages for the editor panel, when the schema can produce them. */
function describeIssues(
  pageId: EditablePageId,
  input: unknown,
): Record<string, string> | null {
  const schema = SCHEMAS[pageId];
  const parsed = schema.safeParse(input);
  return parsed.success ? null : fieldErrorsFrom(parsed.error);
}

/** The Zod schema per page, used only to turn a rejection into field errors. */
const SCHEMAS = {
  home: homepageContentSchema,
  about: pageDocumentSchema,
  "our-craft": pageDocumentSchema,
  sustainability: pageDocumentSchema,
  wholesale: pageDocumentSchema,
  contact: pageDocumentSchema,
} as const;

/* ------------------------------------------------------------------ storage */

async function readValue(key: string): Promise<unknown> {
  const row = await db.siteSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  return row?.value ?? null;
}

async function writeValue(key: string, value: unknown, staffId: string): Promise<Date> {
  // JSON round-trip drops `undefined` so optional fields are stored cleanly.
  const json = JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  const row = await db.siteSetting.upsert({
    where: { key },
    create: { key, value: json, updatedById: staffId },
    update: { value: json, updatedById: staffId },
    select: { updatedAt: true },
  });
  return row.updatedAt;
}

/** The shared tracking list: the current key plus the Part 2 homepage list, merged. */
async function readTracked(): Promise<UploadRecord[]> {
  const [current, legacy] = await Promise.all([
    readValue(UPLOADS_KEY),
    readValue(LEGACY_HOMEPAGE_UPLOADS_KEY),
  ]);
  const merged = [...parseUploadRecords(current)];
  const seen = new Set(merged.map((record) => record.publicId));
  for (const record of parseUploadRecords(legacy)) {
    if (!seen.has(record.publicId)) merged.push(record);
  }
  return merged;
}

/** Writes the merged list to the shared key and empties the legacy one (never deletes it). */
async function writeTracked(records: UploadRecord[], staffId: string): Promise<void> {
  await writeValue(UPLOADS_KEY, records, staffId);
  if (Array.isArray(await readValue(LEGACY_HOMEPAGE_UPLOADS_KEY))) {
    const legacy = parseUploadRecords(await readValue(LEGACY_HOMEPAGE_UPLOADS_KEY));
    if (legacy.length > 0) await writeValue(LEGACY_HOMEPAGE_UPLOADS_KEY, [], staffId);
  }
}

/**
 * Every image referenced anywhere: the draft, the published document and each kept
 * history version, for ALL pages. An image used by another page is never destroyed.
 */
async function referencedAcrossAllPages(): Promise<Set<string>> {
  const keys = EDITABLE_PAGE_IDS.flatMap((id) => [
    draftKey(id),
    publishedKey(id),
    historyKey(id),
  ]);
  const rows = await db.siteSetting.findMany({
    where: { key: { in: keys } },
    select: { key: true, value: true },
  });
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  const ids = new Set<string>();
  const add = (pageId: EditablePageId, document: unknown) => {
    for (const image of pageOps(pageId).images(document)) {
      const publicId = image.publicId.trim();
      if (publicId) ids.add(publicId);
    }
  };

  for (const pageId of EDITABLE_PAGE_IDS) {
    add(pageId, byKey.get(draftKey(pageId)));
    add(pageId, byKey.get(publishedKey(pageId)));
    for (const version of parsePageHistory(byKey.get(historyKey(pageId)))) {
      add(pageId, version.document);
    }
  }
  return ids;
}

/**
 * Destroys assets nothing references any more and stores the remaining tracking list.
 * Failures are counted and reported, never thrown: clean-up must not undo a publish.
 */
async function runCleanup(
  replacedIds: ReadonlySet<string>,
  staffId: string,
): Promise<number> {
  if (!getCloudinaryConfig()) return 0;

  const [tracked, referencedIds] = await Promise.all([
    readTracked(),
    referencedAcrossAllPages(),
  ]);
  const plan = planCleanup({ tracked, replacedIds, referencedIds });
  if (plan.destroy.length === 0 && plan.tracked.length === tracked.length) return 0;

  let failures = 0;
  const survived: string[] = [];
  for (const publicId of plan.destroy) {
    const destroyed = await destroyCloudinaryAsset(publicId);
    if (!destroyed) {
      failures += 1;
      survived.push(publicId); // Keep tracking it so a later publish can try again.
    }
  }

  const now = new Date().toISOString();
  const kept = survived.reduce<UploadRecord[]>(
    (records, publicId) => trackUpload(records, publicId, now),
    plan.tracked,
  );
  await writeTracked(kept, staffId);
  return failures;
}

function cleanupWarning(failures: number): string {
  return failures === 1
    ? " One old image could not be removed from Cloudinary; it will be retried next time."
    : ` ${failures} old images could not be removed from Cloudinary; they will be retried next time.`;
}

function imageIdsOf(pageId: EditablePageId, document: unknown): Set<string> {
  const ids = new Set<string>();
  for (const image of pageOps(pageId).images(document)) {
    const publicId = image.publicId.trim();
    if (publicId) ids.add(publicId);
  }
  return ids;
}

/* ------------------------------------------------------------------ actions */

/**
 * Saves the working copy of one page. Nothing on the public site changes and no Cloudinary
 * asset is destroyed - the draft can still be discarded or replaced by a restore.
 */
export async function savePageDraft(
  pageId: unknown,
  input: unknown,
): Promise<SaveResult> {
  try {
    if (!isEditablePageId(pageId)) return unknownPage();
    const staff = await assertPermission(PAGE_PERMISSION);
    const checked = validate(pageId, input);
    if (!checked.ok) return checked.result;

    const updatedAt = await writeValue(draftKey(pageId), checked.document, staff.id);
    return {
      ok: true,
      message: "Draft saved. The live page is unchanged until you publish.",
      data: { updatedAt: updatedAt.toISOString() },
    };
  } catch (error) {
    return failure(error);
  }
}

function snapshot(
  pageId: EditablePageId,
  document: unknown,
  previous: unknown,
  staff: StaffUser,
): PageVersion {
  return {
    id: newVersionId(),
    publishedAt: new Date().toISOString(),
    publishedBy: { id: staff.id, name: staff.name ?? staff.email },
    changedSections: previous ? pageOps(pageId).changedSections(previous, document) : [],
    document,
  };
}

/**
 * Copies the saved draft to the published document, records a history snapshot, refreshes
 * that page's cache and removes Cloudinary assets no page references any more.
 */
export async function publishPage(
  pageId: unknown,
  latestDraft?: unknown,
): Promise<PublishResult> {
  try {
    if (!isEditablePageId(pageId)) return unknownPage();
    const staff = await assertPermission(PAGE_PERMISSION);
    const ops = pageOps(pageId);

    const [storedDraftValue, publishedValue, historyValue] = await Promise.all([
      readValue(draftKey(pageId)),
      readValue(publishedKey(pageId)),
      readValue(historyKey(pageId)),
    ]);
    const draftValue = latestDraft !== undefined ? latestDraft : storedDraftValue;
    const draft = ops.parse(draftValue);
    if (draft === null) {
      const issues = describeIssues(pageId, draftValue);
      return {
        ok: false,
        message: draftValue
          ? "The saved draft is no longer valid. Open each section, fix the highlighted fields and save again."
          : "There is no saved draft to publish. Save your draft first.",
        ...(issues ? { fieldErrors: issues } : {}),
      };
    }
    const checked = validate(pageId, draft);
    if (!checked.ok) {
      return {
        ok: false,
        message:
          "The saved draft is no longer valid. Open each section, fix the highlighted fields and save again.",
        ...(checked.result.fieldErrors ? { fieldErrors: checked.result.fieldErrors } : {}),
      };
    }
    const document = checked.document;
    const published = ops.parse(publishedValue);

    if (latestDraft !== undefined || storedDraftValue === null) {
      await writeValue(draftKey(pageId), document, staff.id);
    }
    const updatedAt = await writeValue(publishedKey(pageId), document, staff.id);
    const version = snapshot(pageId, document, published, staff);
    const { history, dropped } = addHistoryVersion(
      parsePageHistory(historyValue),
      version,
    );
    await writeValue(historyKey(pageId), history, staff.id);
    updateTag(pageTag(pageId));
    // Also revalidate the public route so Next.js serves the fresh page immediately,
    // including the full route cache and any RSC payload that referenced the old images.
    revalidatePath(EDITABLE_PAGES[pageId].path);
    revalidatePath(EDITABLE_PAGES[pageId].path, "page");

    // Candidates: the document just replaced, plus any version pushed out of the window.
    const replaced = new Set<string>([
      ...imageIdsOf(pageId, published),
      ...dropped.flatMap((entry) => [...imageIdsOf(pageId, entry.document)]),
    ]);
    const failures = await runCleanup(replaced, staff.id);

    return {
      ok: true,
      message: `Published. The page is live.${failures ? cleanupWarning(failures) : ""}`,
      data: {
        updatedAt: updatedAt.toISOString(),
        imageCleanupFailures: failures,
        version,
      },
    };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Throws the working copy away: the editor falls back to the published document. Images
 * that only existed in the discarded draft, and that no other page uses, are removed.
 */
export async function discardPageDraft(
  pageId: unknown,
): Promise<ActionResult<{ imageCleanupFailures: number }>> {
  try {
    if (!isEditablePageId(pageId)) return unknownPage();
    const staff = await assertPermission(PAGE_PERMISSION);
    const draft = pageOps(pageId).parse(await readValue(draftKey(pageId)));

    const { count } = await db.siteSetting.deleteMany({
      where: { key: draftKey(pageId) },
    });
    if (count === 0) return { ok: true, message: "There was no draft to discard." };

    const failures = await runCleanup(imageIdsOf(pageId, draft), staff.id);
    // Invalidate the page's server cache so the live site always reflects published content.
    updateTag(pageTag(pageId));
    revalidatePath(EDITABLE_PAGES[pageId].path);
    return {
      ok: true,
      message: `Draft discarded. The editor now shows the live content.${failures ? cleanupWarning(failures) : ""}`,
      data: { imageCleanupFailures: failures },
    };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Copies a published version back into the draft. It does NOT go live: the admin reviews
 * it and presses Publish. Images are safe because every kept version protects its assets.
 */
export async function restorePageVersion(
  pageId: unknown,
  versionId: unknown,
): Promise<RestoreResult> {
  try {
    if (!isEditablePageId(pageId)) return unknownPage();
    const staff = await assertPermission(PAGE_PERMISSION);
    if (typeof versionId !== "string" || versionId.trim() === "") {
      return { ok: false, message: "Choose a version to restore." };
    }
    const history = parsePageHistory(await readValue(historyKey(pageId)));
    const version = findVersion(history, versionId.trim());
    if (!version) {
      return {
        ok: false,
        message:
          "That version is no longer in the history. Reload the page and try again.",
      };
    }
    const checked = validate(pageId, version.document);
    if (!checked.ok) {
      return {
        ok: false,
        message:
          "That version cannot be restored because its content is no longer valid.",
      };
    }

    await writeValue(draftKey(pageId), checked.document, staff.id);
    return {
      ok: true,
      message:
        "Version restored into the draft. Review it, then publish to make it live.",
      data: { document: checked.document },
    };
  } catch (error) {
    return failure(error);
  }
}

/**
 * Records an image the editor just uploaded, so it can be cleaned up later even if it
 * never reaches a saved draft. Called right after a successful Cloudinary upload.
 */
export async function trackPageUpload(publicId: unknown): Promise<ActionResult> {
  try {
    const staff = await assertPermission(PAGE_PERMISSION);
    if (typeof publicId !== "string" || !isSiteUpload(publicId.trim())) {
      return { ok: false, message: "Unknown upload." };
    }
    const tracked = await readTracked();
    await writeTracked(
      trackUpload(tracked, publicId.trim(), new Date().toISOString()),
      staff.id,
    );
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** Kept so the editor can show the defaults when a page has never been published. */
export async function getPageDefaults(pageId: unknown): Promise<ActionResult<unknown>> {
  try {
    if (!isEditablePageId(pageId)) return unknownPage();
    await assertPermission(PAGE_PERMISSION);
    return { ok: true, data: pageOps(pageId).defaults(await getSiteSettings()) };
  } catch (error) {
    return failure(error);
  }
}
