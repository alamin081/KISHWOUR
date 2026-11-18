import { Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AlibabaRowForm } from "@/components/admin/alibaba-row-form";
import { SettingForm } from "@/components/admin/setting-form";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader, EmptyRow, formatDate, Panel } from "@/components/admin/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSiteSettings } from "@/features/settings/queries";
import { requireStaff } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Alibaba" };

async function AdminAlibabaPageBody() {
  await requireStaff("alibaba:manage");
  const [settings, products, linked] = await Promise.all([
    getSiteSettings(),
    db.product.findMany({
      orderBy: { name: "asc" },
      take: 500,
      select: {
        id: true,
        name: true,
        sku: true,
        alibabaUrl: true,
        alibabaProductId: true,
        alibabaUpdatedAt: true,
      },
    }),
    db.product.count({ where: { alibabaUrl: { not: null } } }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Alibaba"
        description="Links between the Kishwour website and the Alibaba supplier store."
      />
      <div className="mb-6 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <Info className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Integration status: manual links only</p>
          <p className="mt-1">
            No Alibaba API integration is configured. Product data, prices and stock are{" "}
            <strong>not</strong> synchronised automatically — links and IDs below are
            entered by hand, and the time of each manual update is recorded. {linked} of{" "}
            {products.length} product{products.length === 1 ? "" : "s"} have an Alibaba
            link.
          </p>
        </div>
      </div>

      <Panel
        title="Alibaba Store URL"
        description="Shown in the header, footer, PDF catalogue and structured data when set."
        className="mb-6"
      >
        <SettingForm
          settingKey="alibaba"
          initial={{ storeUrl: settings.alibaba.storeUrl }}
          fields={[
            {
              name: "storeUrl",
              label: "Store URL",
              type: "url",
              hint: "https:// link on alibaba.com, e.g. https://yourstore.en.alibaba.com/",
            },
          ]}
        />
      </Panel>

      <Panel title="Product links">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="min-w-[28rem]">Alibaba URL · Product ID</TableHead>
                <TableHead>Last manual update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <EmptyRow colSpan={3}>No products yet.</EmptyRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="font-medium hover:text-forest"
                      >
                        {p.name}
                      </Link>
                      {p.sku ? (
                        <span className="block text-xs text-muted-foreground">
                          SKU {p.sku}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <AlibabaRowForm
                        id={p.id}
                        name={p.name}
                        url={p.alibabaUrl ?? ""}
                        productId={p.alibabaProductId ?? ""}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(p.alibabaUpdatedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </>
  );
}

export default function AdminAlibabaPage() {
  return (
    <AdminBoundary>
      <AdminAlibabaPageBody />
    </AdminBoundary>
  );
}
