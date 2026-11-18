import { Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { ActionButton, ConfirmButton } from "@/components/admin/action-buttons";
import { selectClass } from "@/components/admin/form-fields";
import {
  AdminPageHeader,
  EmptyRow,
  formatDate,
  StatusBadge,
} from "@/components/admin/ui";
import { Pagination } from "@/components/products/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteProduct,
  setProductActive,
  setProductFeatured,
} from "@/features/admin/products/actions";
import { getCategoryOptions, listAdminProducts } from "@/features/admin/products/queries";
import { requireStaff } from "@/lib/auth/session";
import { AdminBoundary } from "@/components/admin/suspense-boundary";

export const metadata: Metadata = { title: "Products" };

async function AdminProductsPageBody(props: PageProps<"/admin/products">) {
  await requireStaff("products:manage");
  const sp = await props.searchParams;
  const one = (k: string) =>
    typeof sp[k] === "string" ? (sp[k] as string).slice(0, 100) : undefined;
  const page = Math.max(1, Number(one("page")) || 1);
  const q = one("q");
  const status = one("status");
  const categoryId = one("category");
  const [{ items, total, totalPages }, categories] = await Promise.all([
    listAdminProducts({ q, status, categoryId, page }),
    getCategoryOptions(),
  ]);

  const hrefFor = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (categoryId) u.set("category", categoryId);
    if (p > 1) u.set("page", String(p));
    return `/admin/products${u.size ? `?${u}` : ""}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}`}
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus aria-hidden /> New product
            </Link>
          </Button>
        }
      />
      <form
        className="mb-4 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-[1fr_12rem_14rem_auto]"
        role="search"
      >
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search name, SKU or slug"
          aria-label="Search products"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className={selectClass}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          <option value="active">Published</option>
          <option value="inactive">Unpublished</option>
          <option value="featured">Featured</option>
        </select>
        <select
          name="category"
          defaultValue={categoryId ?? ""}
          className={selectClass}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          <Search aria-hidden /> Filter
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>MOQ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <EmptyRow colSpan={7}>
                {q || status || categoryId
                  ? "No products match these filters."
                  : "No products yet — create the first one."}
              </EmptyRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="relative size-12 overflow-hidden rounded-md bg-secondary">
                      {p.images[0] ? (
                        <Image
                          src={p.images[0].imageUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium hover:text-forest"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {p.sku ? `SKU ${p.sku} · ` : ""}
                      {p._count.variants} variant{p._count.variants === 1 ? "" : "s"}
                    </p>
                  </TableCell>
                  <TableCell>{p.category.name}</TableCell>
                  <TableCell>
                    {p.minimumOrderQuantity ? `${p.minimumOrderQuantity} ${p.unit}` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge status={p.isActive ? "ACTIVE" : "INACTIVE"} />
                      {p.isFeatured ? (
                        <span className="text-xs font-semibold text-jute-deep">
                          ★ Featured
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(p.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild size="xs" variant="outline">
                        <Link href={`/admin/products/${p.id}/edit`}>Edit</Link>
                      </Button>
                      <ActionButton
                        size="xs"
                        variant="outline"
                        run={setProductActive.bind(null, p.id, !p.isActive)}
                      >
                        {p.isActive ? "Unpublish" : "Publish"}
                      </ActionButton>
                      <ActionButton
                        size="xs"
                        variant="outline"
                        run={setProductFeatured.bind(null, p.id, !p.isFeatured)}
                      >
                        {p.isFeatured ? "Unfeature" : "Feature"}
                      </ActionButton>
                      <ConfirmButton
                        size="xs"
                        variant="outline"
                        className="text-destructive"
                        run={deleteProduct.bind(null, p.id)}
                        title={`Delete “${p.name}”?`}
                        description="This permanently deletes the product, its images and variants. Inquiries and quotations keep the product name. To hide it instead, use Unpublish."
                        confirmLabel="Delete product"
                      >
                        Delete
                      </ConfirmButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </>
  );
}

export default function AdminProductsPage(props: PageProps<"/admin/products">) {
  return (
    <AdminBoundary>
      <AdminProductsPageBody {...props} />
    </AdminBoundary>
  );
}
