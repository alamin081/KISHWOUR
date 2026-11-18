import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { InquiryList } from "@/components/admin/inquiry-list";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Inquiries" };

async function AdminInquiriesPageBody(props: PageProps<"/admin/inquiries">) {
  await requireStaff("inquiries:manage");
  return (
    <>
      <AdminPageHeader
        title="Inquiries"
        description="Contact, wholesale, OEM/ODM and sample inquiries from the website."
        actions={
          <Button asChild>
            <Link href="/admin/inquiries/new">
              <Plus aria-hidden /> Record inquiry
            </Link>
          </Button>
        }
      />
      <InquiryList basePath="/admin/inquiries" searchParams={await props.searchParams} />
    </>
  );
}

export default function AdminInquiriesPage(props: PageProps<"/admin/inquiries">) {
  return (
    <AdminBoundary>
      <AdminInquiriesPageBody {...props} />
    </AdminBoundary>
  );
}
