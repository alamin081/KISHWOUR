import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/category-form";
import { DeleteCategory } from "@/components/admin/delete-category";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { getCategoryForEdit } from "@/features/admin/categories/queries";
import { getCategoryOptions } from "@/features/admin/products/queries";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Edit category" };

async function EditCategoryPageBody(props: PageProps<"/admin/categories/[id]/edit">) {
  await requireStaff("categories:manage");
  const { id } = await props.params;
  const [category, options] = await Promise.all([
    getCategoryForEdit(id),
    getCategoryOptions(),
  ]);
  if (!category) notFound();
  const others = options.filter((o) => o.id !== id);

  return (
    <>
      <AdminPageHeader
        title={category.name}
        back={{ href: "/admin/categories", label: "Categories" }}
      />
      <CategoryForm
        categoryId={category.id}
        parents={others}
        defaultValues={{
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          image: category.image ?? "",
          imagePublicId: category.imagePublicId ?? "",
          parentId: category.parentId ?? "",
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          seoTitle: category.seoTitle ?? "",
          seoDescription: category.seoDescription ?? "",
        }}
      />
      <Panel title="Delete category" className="mt-8 border-destructive/30">
        <DeleteCategory
          id={category.id}
          name={category.name}
          productCount={category._count.products}
          targets={others}
        />
      </Panel>
    </>
  );
}

export default function EditCategoryPage(
  props: PageProps<"/admin/categories/[id]/edit">,
) {
  return (
    <AdminBoundary>
      <EditCategoryPageBody {...props} />
    </AdminBoundary>
  );
}
