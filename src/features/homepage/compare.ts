import { deepEqual } from "@/features/pages/compare";

import { type HomepageContent } from "./schema";
import { HOMEPAGE_SECTION_IDS, type HomepageSectionId } from "./sections";

/**
 * Structural comparison of homepage documents. Used by the editor for the "Unsaved changes"
 * and "Draft differs from live" indicators and for the publish confirmation summary.
 */

/** True when two documents are identical, regardless of key order. */
export function sameHomepageContent(a: HomepageContent, b: HomepageContent): boolean {
  return deepEqual(a, b);
}

/** Sections whose content (text, image, visibility or position) differs between documents. */
export function changedSectionIds(
  a: HomepageContent,
  b: HomepageContent,
): HomepageSectionId[] {
  return HOMEPAGE_SECTION_IDS.filter((id) => !deepEqual(a[id], b[id]));
}
