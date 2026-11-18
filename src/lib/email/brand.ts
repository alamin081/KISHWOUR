import "server-only";

import { absoluteUrl, siteConfig } from "@/config/site";
import { whatsAppLink } from "@/features/products/links";
import { getSiteSettings } from "@/features/settings/queries";

import { type Brand } from "./templates";

/** Branding and contact details for transactional emails (from the editable settings). */
export async function getEmailBrand(): Promise<Brand> {
  const { contact } = await getSiteSettings();
  return {
    siteUrl: absoluteUrl("/"),
    logoUrl: absoluteUrl(siteConfig.logo.src),
    contactEmail: contact.email ?? null,
    whatsappUrl: contact.whatsapp
      ? whatsAppLink(contact.whatsapp, "Hello Kishwour")
      : null,
  };
}
