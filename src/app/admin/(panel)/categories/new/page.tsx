import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/category-form";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader } from "@/components/admin/ui";
import { getCategoryOptions } from "@/features/admin/products/queries";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New category" };

async function NewCategoryPageBody() {
  await requireStaff("categories:manage");
  const parents = await getCategoryOptions();
  return (
    <>
      <AdminPageHeader
        title="New category"
        back={{ href: "/admin/categories", label: "Categories" }}
      />
      <CategoryForm
        categoryId={null}
        parents={parents}
        defaultValues={{
          name: "",
          slug: "",
          description: "",
          image: "",
          imagePublicId: "",
          parentId: "",
          sortOrder: 0,
          isActive: true,
          seoTitle: "",
          seoDescription: "",
        }}
      />
    </>
  );
}

export default function NewCategoryPage() {
  return (
    <AdminBoundary>
      <NewCategoryPageBody />
    </AdminBoundary>
  );
}
