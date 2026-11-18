import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BuyerInquiryForm } from "@/components/forms/buyer-inquiry-form";
import { PageBlocks } from "@/components/pages/blocks";
import { SocialLinks } from "@/components/shared/social-links";
import { routes } from "@/config/site";
import { getPublicPage, getPublicPageMetadata } from "@/features/pages/public";
import { getSiteSettings } from "@/features/settings/queries";
import { COUNTRY_OPTIONS } from "@/lib/data/countries";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPublicPageMetadata("contact");
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: routes.contact },
  };
}

/**
 * The heading comes from the document published in /admin/pages/contact. The contact
 * details below it stay with the `contact` setting and the inquiry form is unchanged.
 */
export default async function ContactPage() {
  const [settings, page] = await Promise.all([
    getSiteSettings(),
    getPublicPage("contact"),
  ]);
  const { email, phone, whatsapp, address } = settings.contact;
  const details = [
    email && {
      icon: Mail,
      label: "Business email",
      value: email,
      href: `mailto:${email}`,
    },
    phone && {
      icon: Phone,
      label: "Phone",
      value: phone,
      href: `tel:${phone.replace(/\s+/g, "")}`,
    },
    whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: `+${whatsapp}`,
      href: `https://wa.me/${whatsapp}`,
      external: true,
    },
    address && { icon: MapPin, label: "Company address", value: address },
  ].filter(Boolean) as {
    icon: typeof Mail;
    label: string;
    value: string;
    href?: string;
    external?: boolean;
  }[];

  return (
    <>
      <PageBlocks document={page.document} data={page.data} />

      <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <aside aria-label="Contact details" className="space-y-8">
          {details.length > 0 ? (
            <ul className="space-y-6">
              {details.map((d) => (
                <li key={d.label} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-forest">
                    <d.icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm text-muted-foreground">{d.label}</p>
                    {d.href ? (
                      <a
                        href={d.href}
                        className="font-medium break-all hover:text-forest"
                        {...(d.external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {d.value}
                      </a>
                    ) : (
                      <p className="font-medium">{d.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <h2 className="text-2xl">Send us a message</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Use the form and we will reply to the email address you provide.
              </p>
            </div>
          )}

          <SocialLinks social={settings.social} />

          <div className="rounded-xl bg-secondary/60 p-6">
            <h2 className="font-sans text-base font-semibold">Need a quotation?</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              For wholesale, private label, samples or custom manufacturing, our quotation
              form collects the details we need.
            </p>
            <Link
              href={routes.requestQuote}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
            >
              Request a Quote <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </aside>

        <section aria-labelledby="contact-form-heading">
          <h2 id="contact-form-heading" className="sr-only">
            Contact form
          </h2>
          <BuyerInquiryForm kind="contact" countries={COUNTRY_OPTIONS} />
        </section>
      </div>
    </>
  );
}
