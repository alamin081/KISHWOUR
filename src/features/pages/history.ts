import { z } from "zod";

/**
 * Publish history, shared by every editable page.
 *
 * A snapshot of the document behind each Publish, newest first, capped at
 * `PAGE_HISTORY_LIMIT`. The document is stored as-is and validated against the page's own
 * schema when it is restored, so one history module serves the homepage (whose documents
 * are keyed sections) and the block-based pages alike.
 */

export const PAGE_HISTORY_LIMIT = 10;

export const pageVersionSchema = z.object({
  id: z.string().trim().min(1).max(60),
  /** ISO timestamp of the publish. */
  publishedAt: z.string().trim().min(1).max(40),
  publishedBy: z.object({
    id: z.string().trim().max(60),
    name: z.string().trim().max(200),
  }),
  /**
   * Section or block IDs that differed from the previously published document. Stored as
   * plain strings: an ID from a future version must not invalidate the whole history.
   */
  changedSections: z.array(z.string().trim().max(60)).max(40),
  /** The published document. Shape depends on the page; validated on restore. */
  document: z.unknown(),
});

export type PageVersion = z.infer<typeof pageVersionSchema>;

/**
 * Validates a stored history. Unreadable entries are dropped individually rather than
 * discarding the whole history, so one bad snapshot never hides the others.
 */
export function parsePageHistory(value: unknown): PageVersion[] {
  if (!Array.isArray(value)) return [];
  const versions: PageVersion[] = [];
  for (const entry of value) {
    const parsed = pageVersionSchema.safeParse(entry);
    if (parsed.success) versions.push(parsed.data);
  }
  return versions;
}

/** A new version ID. Falls back to a timestamp when `crypto` is unavailable. */
export function newVersionId(): string {
  const random = globalThis.crypto?.randomUUID?.();
  return (
    random ?? `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}

/**
 * Puts `version` at the front and trims to `limit`. Returns the dropped versions as well,
 * because their images become clean-up candidates.
 */
export function addHistoryVersion(
  history: readonly PageVersion[],
  version: PageVersion,
  limit: number = PAGE_HISTORY_LIMIT,
): { history: PageVersion[]; dropped: PageVersion[] } {
  const next = [version, ...history.filter((v) => v.id !== version.id)];
  return { history: next.slice(0, limit), dropped: next.slice(limit) };
}

/** Looks one version up by ID. */
export function findVersion(
  history: readonly PageVersion[],
  id: string,
): PageVersion | null {
  return history.find((version) => version.id === id) ?? null;
}
