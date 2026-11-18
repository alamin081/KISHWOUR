import { ContactCtaView } from "@/components/homepage/sections";
import { getPublishedHomepage } from "@/features/homepage/queries";
import { getSiteSettings } from "@/features/settings/queries";

/**
 * Closing CTA for the editorial pages: Request a Quote, Contact Us and WhatsApp (only when
 * a number is configured). The text comes from the published homepage Contact section, so
 * one edit in the Homepage Editor updates every page that shows this band.
 */
export async function ContactCta({ className }: { className?: string }) {
  const [settings, homepage] = await Promise.all([
    getSiteSettings(),
    getPublishedHomepage(),
  ]);
  const content = homepage.contact;
  return (
    <ContactCtaView
      title={content.title}
      text={content.text}
      primaryCtaLabel={content.primaryCtaLabel}
      secondaryCtaLabel={content.secondaryCtaLabel || undefined}
      whatsappLabel={content.whatsappLabel || undefined}
      whatsapp={settings.contact.whatsapp}
      className={className}
    />
  );
}
