import { Boxes } from "lucide-react";
import type { Metadata } from "next";

import { CategoryCard } from "@/components/products/category-card";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { routes } from "@/config/site";
import { getActiveCategories } from "@/features/categories/queries";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse Kishwour's handmade product categories from Bangladesh.",
  alternates: { canonical: routes.categories },
};

export default async function CategoriesPage() {
  const categories = await getActiveCategories();
  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="Handmade product lines from Bangladesh."
      >
        <Breadcrumbs items={[{ label: "Categories", href: routes.categories }]} />
      </PageHeader>
      <div className="container-page py-10 sm:py-14">
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {categories.map((c) => (
              <CategoryCard key={c.slug} category={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Boxes}
            title="Categories are being added"
            description="Our product categories will appear here shortly."
          />
        )}
      </div>
    </>
  );
}
