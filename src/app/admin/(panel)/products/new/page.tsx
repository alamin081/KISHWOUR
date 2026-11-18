import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader } from "@/components/admin/ui";
import { emptyProductForm } from "@/features/admin/products/form-values";
import { getCategoryOptions } from "@/features/admin/products/queries";
import { requireStaff } from "@/lib/auth/session";
import { COUNTRY_OPTIONS } from "@/lib/data/countries";

export const metadata: Metadata = { title: "New product" };

async function NewProductPageBody() {
  await requireStaff("products:manage");
  const categories = await getCategoryOptions();
  return (
    <>
      <AdminPageHeader
        title="New product"
        back={{ href: "/admin/products", label: "Products" }}
      />
      {categories.length === 0 ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Create a category first — every product belongs to a category.
        </p>
      ) : (
        <ProductForm
          productId={null}
          defaultValues={emptyProductForm}
          categories={categories}
          countries={COUNTRY_OPTIONS}
        />
      )}
    </>
  );
}

export default function NewProductPage() {
  return (
    <AdminBoundary>
      <NewProductPageBody />
    </AdminBoundary>
  );
}
