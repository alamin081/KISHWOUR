import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { PageEditor } from "@/components/admin/page-editor/page-editor";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader } from "@/components/admin/ui";
import { type HomepageRenderData } from "@/components/homepage/sections";
import { type PageRenderData } from "@/components/pages/blocks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { verifiedSustainabilityClaims } from "@/content/site-content";
import { getActiveCategories } from "@/features/categories/queries";
import { getPublishedHomepage } from "@/features/homepage/queries";
import {
  EDITABLE_PAGE_IDS,
  EDITABLE_PAGES,
  type EditablePageId,
  isEditablePageId,
} from "@/features/pages/ids";
import { PAGE_PERMISSION } from "@/features/pages/permission";
import { getPageEditorData } from "@/features/pages/queries";
import { getFeaturedProducts, listProducts } from "@/features/products/queries";
import { getSiteSettings } from "@/features/settings/queries";
import { requireStaff } from "@/lib/auth/session";
import { getIntegrationStatus } from "@/lib/env/server";

export function generateStaticParams() {
  return EDITABLE_PAGE_IDS.map((page) => ({ page }));
}

export async function generateMetadata({
  params,
}: PageProps<"/admin/pages/[page]">): Promise<Metadata> {
  const { page } = await params;
  const title = isEditablePageId(page) ? EDITABLE_PAGES[page].label : "Page";
  return { title: `${title} editor` };
}

/** The homepage preview needs real categories and products; other pages do not. */
async function homePreviewData(
  whatsapp: string | undefined,
): Promise<HomepageRenderData> {
  const [categories, featured] = await Promise.all([
    getActiveCategories(),
    getFeaturedProducts(8),
  ]);
  const products =
    featured.length > 0 ? featured : (await listProducts({ page: 1 })).items.slice(0, 8);
  return {
    categories,
    products,
    sustainabilityClaims: verifiedSustainabilityClaims,
    ...(whatsapp ? { whatsapp } : {}),
  };
}

async function Editor({ pageId }: { pageId: EditablePageId }) {
  // The guard lives inside the boundary with the data it protects (see the pages list).
  await requireStaff(PAGE_PERMISSION);
  const meta = EDITABLE_PAGES[pageId];
  const [initial, settings, homepage] = await Promise.all([
    getPageEditorData(pageId),
    getSiteSettings(),
    getPublishedHomepage(),
  ]);
  const whatsapp = settings.contact.whatsapp;

  const page: PageRenderData = {
    breadcrumb: { label: meta.label, href: meta.path },
    contact: {
      title: homepage.contact.title,
      text: homepage.contact.text,
      primaryCtaLabel: homepage.contact.primaryCtaLabel,
      secondaryCtaLabel: homepage.contact.secondaryCtaLabel,
      whatsappLabel: homepage.contact.whatsappLabel,
    },
    ...(whatsapp ? { whatsapp } : {}),
  };

  return (
    <PageEditor
      pageId={pageId}
      initial={initial}
      preview={{
        home: pageId === "home" ? await homePreviewData(whatsapp) : null,
        page,
      }}
      cloudinaryConfigured={getIntegrationStatus().cloudinary}
    />
  );
}

function EditorSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-[70vh] min-h-[32rem] w-full rounded-xl" />
    </div>
  );
}

async function AdminPageEditorRouteBody({ params }: PageProps<"/admin/pages/[page]">) {
  const { page } = await params;
  if (!isEditablePageId(page)) notFound();
  const meta = EDITABLE_PAGES[page];

  return (
    <div className="flex min-h-0 flex-col">
      <AdminPageHeader
        title={`${meta.label} editor`}
        description="Edit the page exactly as visitors see it. Hover a section for its controls. Changes are kept as a draft until you publish."
        back={{ href: "/admin/pages", label: "All pages" }}
        actions={
          <>
            <Button asChild variant="outline">
              <a href={meta.path} target="_blank" rel="noopener">
                <ExternalLink aria-hidden /> View live page
              </a>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/content">Business details</Link>
            </Button>
          </>
        }
      />
      {/* The editor loads the draft at request time; the shell renders immediately. */}
      <Suspense fallback={<EditorSkeleton />}>
        <Editor pageId={page} />
      </Suspense>
    </div>
  );
}

export default function AdminPageEditorRoute(props: PageProps<"/admin/pages/[page]">) {
  return (
    <AdminBoundary>
      <AdminPageEditorRouteBody {...props} />
    </AdminBoundary>
  );
}
