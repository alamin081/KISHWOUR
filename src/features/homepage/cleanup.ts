import { SITE_UPLOAD_FOLDER } from "@/features/admin/upload-kinds";

import { cloudinaryPublicIdFromUrl } from "./image-url";
import {
  HOMEPAGE_IMAGE_SECTION_IDS,
  type HomepageContent,
  type HomepageImage,
} from "./schema";

/**
 * Cloudinary housekeeping for homepage images - pure functions so the rules are unit
 * testable without a database or network.
 *
 * The rule: an uploaded asset may only be destroyed once it is referenced by **none** of
 * the draft, the published document and the version history. Editing a draft never deletes
 * anything; cleanup runs after a publish or an explicit discard.
 */

/** Every image reference in a document: section photos first, then testimonial portraits. */
export function collectImages(content: HomepageContent | null): HomepageImage[] {
  if (!content) return [];
  const images: HomepageImage[] = [];
  for (const id of HOMEPAGE_IMAGE_SECTION_IDS) {
    const image = content[id].image;
    if (image) images.push(image);
  }
  for (const testimonial of content.testimonials.items) {
    if (testimonial.photo) images.push(testimonial.photo);
  }
  return images;
}

/** The Cloudinary public ID of one image: the stored one, or derived from its URL. */
export function imagePublicId(image: HomepageImage): string | null {
  const stored = image.publicId.trim();
  if (stored) return stored;
  return cloudinaryPublicIdFromUrl(image.url);
}

/** All public IDs referenced by a document. */
export function collectPublicIds(content: HomepageContent | null): Set<string> {
  const ids = new Set<string>();
  for (const image of collectImages(content)) {
    const id = imagePublicId(image);
    if (id) ids.add(id);
  }
  return ids;
}

/** All public IDs referenced by any of the given documents. */
export function collectPublicIdsFrom(
  documents: readonly (HomepageContent | null)[],
): Set<string> {
  const ids = new Set<string>();
  for (const document of documents) {
    for (const id of collectPublicIds(document)) ids.add(id);
  }
  return ids;
}

/** Only assets this editor uploaded may be destroyed - never product or category media. */
export function isSiteUpload(publicId: string): boolean {
  return publicId.startsWith(`${SITE_UPLOAD_FOLDER}/`);
}
