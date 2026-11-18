import "server-only";

import { getPublishedPage } from "@/features/pages/queries";
import { getSiteSettings } from "@/features/settings/queries";

import {
  type HomepageContent,
  homepageDefaultsFrom,
  parseHomepageContent,
} from "./schema";

/**
 * The homepage as visitors see it, typed.
 *
 * The storage, caching and fallback all live in the shared page engine
 * (`src/features/pages`); this wrapper only narrows the document back to
 * `HomepageContent` for the public homepage and the shared contact band.
 */
export async function getPublishedHomepage(): Promise<HomepageContent> {
  const published = await getPublishedPage("home");
  const parsed = parseHomepageContent(published);
  if (parsed) return parsed;
  return homepageDefaultsFrom((await getSiteSettings()).home);
}
