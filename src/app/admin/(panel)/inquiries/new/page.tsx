import type { Metadata } from "next";

import { ManualInquiryForm } from "@/components/admin/manual-inquiry-form";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/session";
import { COUNTRY_OPTIONS } from "@/lib/data/countries";

export const metadata: Metadata = { title: "Record inquiry" };

async function NewManualInquiryPageBody() {
  await requireStaff("inquiries:manage");
  return (
    <>
      <AdminPageHeader
        title="Record an inquiry"
        description="For requests received via Alibaba, WhatsApp, email or in person. No email is sent to the buyer."
        back={{ href: "/admin/inquiries", label: "Inquiries" }}
      />
      <ManualInquiryForm countries={COUNTRY_OPTIONS} />
    </>
  );
}

export default function NewManualInquiryPage() {
  return (
    <AdminBoundary>
      <NewManualInquiryPageBody />
    </AdminBoundary>
  );
}
