import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";
import { productToForm } from "@/features/admin/products/form-values";
import { getCategoryOptions, getProductForEdit } from "@/features/admin/products/queries";
import { requireStaff } from "@/lib/auth/session";
import { COUNTRY_OPTIONS } from "@/lib/data/countries";

export const metadata: Metadata = { title: "Edit product" };

async function EditProductPageBody(props: PageProps<"/admin/products/[id]/edit">) {
  await requireStaff("products:manage");
  const { id } = await props.params;
  const [product, categories] = await Promise.all([
    getProductForEdit(id),
    getCategoryOptions(),
  ]);
  if (!product) notFound();

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={product.isActive ? "Published" : "Not published"}
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          product.isActive ? (
            <Button asChild variant="outline" size="sm">
              <a href={routes.product(product.slug)} target="_blank" rel="noopener">
                View on website <ExternalLink aria-hidden />
              </a>
            </Button>
          ) : undefined
        }
      />
      <ProductForm
        productId={product.id}
        defaultValues={productToForm(product)}
        categories={categories}
        countries={COUNTRY_OPTIONS}
      />
    </>
  );
}

export default function EditProductPage(props: PageProps<"/admin/products/[id]/edit">) {
  return (
    <AdminBoundary>
      <EditProductPageBody {...props} />
    </AdminBoundary>
  );
}
