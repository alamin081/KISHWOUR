import type { Metadata } from "next";

import { PageBlocks } from "@/components/pages/blocks";
import { routes } from "@/config/site";
import { getPublicPage, getPublicPageMetadata } from "@/features/pages/public";

const PAGE_ID = "wholesale" as const;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPublicPageMetadata(PAGE_ID);
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: routes.wholesale },
  };
}

/**
 * Rendered from the document published in /admin/pages/wholesale. Falls back to the content
 * in src/content/site-content.ts when nothing is published or the database is unreachable.
 */
export default async function Page() {
  const { document, data } = await getPublicPage(PAGE_ID);
  return <PageBlocks document={document} data={data} />;
}
