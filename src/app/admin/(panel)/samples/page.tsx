import type { Metadata } from "next";

import { InquiryList } from "@/components/admin/inquiry-list";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sample requests" };

async function SamplesBody(props: PageProps<"/admin/samples">) {
  await requireStaff("inquiries:manage");
  return (
    <>
      <AdminPageHeader
        title="Sample requests"
        description="Inquiries of type “Sample request”. Open one to update status and notes."
      />
      <InquiryList
        basePath="/admin/samples"
        searchParams={await props.searchParams}
        fixedType="SAMPLE_REQUEST"
      />
    </>
  );
}

export default function AdminSamplesPage(props: PageProps<"/admin/samples">) {
  return (
    <AdminBoundary>
      <SamplesBody {...props} />
    </AdminBoundary>
  );
}
