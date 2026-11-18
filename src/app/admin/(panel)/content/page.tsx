import { LayoutTemplate } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SettingForm } from "@/components/admin/setting-form";
import { AdminBoundary } from "@/components/admin/suspense-boundary";
import { AdminPageHeader, formatDate, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { getSettingsMeta, getSiteSettings } from "@/features/settings/queries";
import { can } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Content" };

async function AdminContentPageBody() {
  const staff = await requireStaff("content:manage");
  const [s, meta] = await Promise.all([
    getSiteSettings(),
    getSettingsMeta().catch(() => []),
  ]);
  const updated = (key: string) => {
    const m = meta.find((x) => x.key === key);
    return m
      ? `Last saved ${formatDate(m.updatedAt)}${m.updatedBy ? ` by ${m.updatedBy.name ?? m.updatedBy.email}` : ""}`
      : "Using the default text";
  };
  const isAdmin = can(staff.role, "settings:manage");

  return (
    <>
      <AdminPageHeader
        title="Content"
        description="Edit website text and business details. Changes appear on the website immediately after saving."
      />
      <div className="space-y-6">
        <Panel title="Brand & footer" description={updated("brand")}>
          <SettingForm
            settingKey="brand"
            initial={{ ...s.brand }}
            fields={[
              { name: "tagline", label: "Tagline", required: true },
              {
                name: "announcementMessage",
                label: "Announcement bar message",
                hint: "Leave empty to hide the bar",
              },
              {
                name: "description",
                label: "Brand description",
                type: "textarea",
                required: true,
                hint: "Used in the footer and as the default site description",
              },
              {
                name: "footerText",
                label: "Footer text (optional)",
                type: "textarea",
                hint: "Overrides the brand description in the footer",
              },
            ]}
          />
        </Panel>
        <Panel
          title="Homepage"
          description="Homepage text, images, section order and visibility are edited visually."
        >
          <p className="text-sm text-muted-foreground">
            The Homepage Editor shows the homepage as visitors see it, with a draft you
            can publish when it is ready.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/homepage">
              <LayoutTemplate aria-hidden /> Open the Homepage Editor
            </Link>
          </Button>
        </Panel>
        <Panel
          title="About Us page"
          description="Edited visually, with a draft and publish workflow."
        >
          <p className="text-sm text-muted-foreground">
            The About Us page is now edited in the page editor, together with its images,
            section order and search engine listing.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/admin/pages/about">
              <LayoutTemplate aria-hidden /> Open the About Us editor
            </Link>
          </Button>
        </Panel>
        {isAdmin ? (
          <>
            <Panel
              title="Contact details"
              description={`${updated("contact")} · shown in the footer, Contact page, product pages and PDFs`}
            >
              <SettingForm
                settingKey="contact"
                initial={{ ...s.contact }}
                fields={[
                  { name: "email", label: "Business email", type: "email" },
                  { name: "phone", label: "Phone" },
                  {
                    name: "whatsapp",
                    label: "WhatsApp number",
                    hint: "International format, digits only, e.g. 8801XXXXXXXXX",
                  },
                  { name: "address", label: "Company address", type: "textarea" },
                ]}
              />
            </Panel>
            <Panel title="Social media links" description={updated("social")}>
              <SettingForm
                settingKey="social"
                initial={{ ...s.social }}
                fields={[
                  { name: "facebook", label: "Facebook", type: "url" },
                  { name: "instagram", label: "Instagram", type: "url" },
                  { name: "linkedin", label: "LinkedIn", type: "url" },
                  { name: "youtube", label: "YouTube", type: "url" },
                ]}
              />
            </Panel>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Contact details and social links can be edited by administrators.
          </p>
        )}
      </div>
    </>
  );
}

export default function AdminContentPage() {
  return (
    <AdminBoundary>
      <AdminContentPageBody />
    </AdminBoundary>
  );
}
