import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getActiveCategories } from "@/features/categories/queries";

/** Public storefront: header (with database categories), main content, footer. */
export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const categories = (await getActiveCategories()).map(({ name, slug, description }) => ({
    name,
    slug,
    description,
  }));

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-forest focus:px-4 focus:py-2 focus:text-warm-white"
      >
        Skip to content
      </a>
      <SiteHeader categories={categories} />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter categories={categories} showInquiryBand={false} />
    </>
  );
}
