import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ActionButton } from "@/components/admin/action-buttons";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader, EmptyRow, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { routes } from "@/config/site";
import { setCategoryActive } from "@/features/admin/categories/actions";
import { listAdminCategories } from "@/features/admin/categories/queries";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Categories" };

async function AdminCategoriesPageBody() {
  await requireStaff("categories:manage");
  const categories = await listAdminCategories();
  return (
    <>
      <AdminPageHeader
        title="Categories"
        description={`${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
        actions={
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus aria-hidden /> New category
            </Link>
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <EmptyRow colSpan={6}>No categories yet — create the first one.</EmptyRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell style={{ paddingLeft: `${0.5 + c.depth * 1.5}rem` }}>
                    <Link
                      href={`/admin/categories/${c.id}/edit`}
                      className="font-medium hover:text-forest"
                    >
                      {c.depth > 0 ? "↳ " : ""}
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {routes.category(c.slug)}
                  </TableCell>
                  <TableCell>{c._count.products}</TableCell>
                  <TableCell>{c.sortOrder}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.isActive ? "ACTIVE" : "INACTIVE"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild size="xs" variant="outline">
                        <Link href={`/admin/categories/${c.id}/edit`}>Edit</Link>
                      </Button>
                      <ActionButton
                        size="xs"
                        variant="outline"
                        run={setCategoryActive.bind(null, c.id, !c.isActive)}
                      >
                        {c.isActive ? "Hide" : "Show"}
                      </ActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

export default function AdminCategoriesPage() {
  return (
    <AdminBoundary>
      <AdminCategoriesPageBody />
    </AdminBoundary>
  );
}
