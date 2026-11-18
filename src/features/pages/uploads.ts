import { z } from "zod";

import { isSiteUpload } from "@/features/homepage/cleanup";

/**
 * Tracking for every image uploaded through the page editors.
 *
 * Without it, clean-up could only see assets that had reached a saved document: an image
 * uploaded and then replaced before saving was referenced nowhere and stayed in Cloudinary
 * forever. Each upload is recorded here, so clean-up finds those too.
 *
 * One list covers every page, so an image used on another page is never destroyed.
 */

export const uploadRecordSchema = z.object({
  publicId: z.string().trim().min(1).max(300),
  /** ISO timestamp of the upload. */
  uploadedAt: z.string().trim().min(1).max(40),
});

export type UploadRecord = z.infer<typeof uploadRecordSchema>;

/** Capped so a long-lived site cannot grow this row without bound. */
export const MAX_TRACKED_UPLOADS = 500;

export const pageUploadsSchema = z.array(uploadRecordSchema).max(MAX_TRACKED_UPLOADS);

/** Validates a stored list, dropping unreadable entries. */
export function parseUploadRecords(value: unknown): UploadRecord[] {
  if (!Array.isArray(value)) return [];
  const records: UploadRecord[] = [];
  for (const entry of value) {
    const parsed = uploadRecordSchema.safeParse(entry);
    if (parsed.success) records.push(parsed.data);
  }
  return records;
}

/** Records an upload, replacing any earlier entry for the same asset. Newest first. */
export function trackUpload(
  records: readonly UploadRecord[],
  publicId: string,
  uploadedAt: string,
): UploadRecord[] {
  const trimmed = publicId.trim();
  if (!trimmed) return [...records];
  return [
    { publicId: trimmed, uploadedAt },
    ...records.filter((record) => record.publicId !== trimmed),
  ].slice(0, MAX_TRACKED_UPLOADS);
}

export type CleanupPlan = {
  /** Assets to destroy in Cloudinary. */
  destroy: string[];
  /** The tracking list to store afterwards (destroyed assets removed). */
  tracked: UploadRecord[];
};

/**
 * Decides which assets may be destroyed after a publish or a discard.
 *
 * An asset is destroyed only when both of these hold:
 *  - it lives under the site upload folder (never catalogue media), and
 *  - nothing references it any more - not the draft, not the published document, and not
 *    any kept history version, so a Restore can never bring back a broken image.
 *
 * Candidates come from the tracking list (every upload, including ones that never reached
 * a saved document) and from the documents this operation replaced (which covers images
 * uploaded before tracking existed).
 */
export function planCleanup({
  tracked,
  replacedIds,
  referencedIds,
}: {
  tracked: readonly UploadRecord[];
  /** IDs from documents this operation replaced (old published, dropped versions, …). */
  replacedIds: ReadonlySet<string>;
  /** IDs still referenced by the draft, the published document or the history. */
  referencedIds: ReadonlySet<string>;
}): CleanupPlan {
  const destroy = new Set<string>();
  const deletable = (publicId: string) =>
    isSiteUpload(publicId) && !referencedIds.has(publicId);

  for (const record of tracked) {
    if (deletable(record.publicId)) destroy.add(record.publicId);
  }
  for (const publicId of replacedIds) {
    if (deletable(publicId)) destroy.add(publicId);
  }

  return {
    destroy: [...destroy],
    tracked: tracked.filter((record) => !destroy.has(record.publicId)),
  };
}
