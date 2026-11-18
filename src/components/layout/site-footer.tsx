import { ExternalLink, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";

import { NewsletterForm } from "@/components/forms/newsletter-form";
import { BrandLogo } from "@/components/shared/brand-logo";
import { InquiryCta } from "@/components/shared/inquiry-cta";
import { SocialLinks } from "@/components/shared/social-links";
import { footerQuickLinks, routes, siteConfig } from "@/config/site";
import { getSiteSettings } from "@/features/settings/queries";

import { type NavCategory } from "./types";

async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.18em] text-charcoal uppercase">
      {children}
    </h2>
  );
}

const linkClass = "text-charcoal/80 hover:text-forest text-sm transition-colors";

type SiteFooterProps = {
  categories: NavCategory[];
  alibabaStoreUrl?: string;
  /** Show the export inquiry band above the footer. */
  showInquiryBand?: boolean;
  /** Defaults to siteConfig.features.newsletter (hidden until storage is connected). */
  showNewsletter?: boolean;
};

export async function SiteFooter({
  categories,
  alibabaStoreUrl: alibabaOverride,
  showInquiryBand = true,
  showNewsletter = siteConfig.features.newsletter,
}: SiteFooterProps) {
  const settings = await getSiteSettings();
  const alibabaStoreUrl = alibabaOverride ?? settings.alibaba.storeUrl;
  const { email, phone, whatsapp, address } = settings.contact;

  return (
    <footer>
      {showInquiryBand ? <InquiryCta /> : null}

      <div className="bg-secondary">
        <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:py-16">
          {/* Company */}
          <div className="sm:col-span-2 lg:col-span-4">
            <BrandLogo height={52} />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-charcoal/80">
              {settings.brand.footerText ?? settings.brand.description}
            </p>
            {alibabaStoreUrl ? (
              <a
                href={alibabaStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
              >
                Visit our Alibaba Store <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : null}
            <SocialLinks social={settings.social} className="mt-5" />
          </div>

          {/* Product categories (hidden until categories exist) */}
          {categories.length > 0 ? (
            <nav aria-labelledby="footer-categories" className="lg:col-span-3">
              <FooterHeading>
                <span id="footer-categories">Product categories</span>
              </FooterHeading>
              <ul className="space-y-2.5">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={routes.category(c.slug)} className={linkClass}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {/* Quick links */}
          <nav aria-labelledby="footer-quick" className="lg:col-span-2">
            <FooterHeading>
              <span id="footer-quick">Quick links</span>
            </FooterHeading>
            <ul className="space-y-2.5">
              {footerQuickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={linkClass}>
                    {l.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Export inquiry + contact */}
          <div className="lg:col-span-3">
            <FooterHeading>Export inquiry</FooterHeading>
            <p className="text-sm leading-relaxed text-charcoal/80">
              Importers, wholesalers and brands: request a quotation for wholesale or
              custom orders.
            </p>
            <Link
              href={routes.requestQuote}
              className="mt-3 inline-block text-sm font-semibold text-forest hover:underline"
            >
              Send an export inquiry →
            </Link>

            {email || phone || whatsapp || address ? (
              <ul className="mt-6 space-y-2.5 text-sm text-charcoal/80">
                {email ? (
                  <li className="flex items-start gap-2.5">
                    <Mail className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    <a href={`mailto:${email}`} className="hover:text-forest">
                      {email}
                    </a>
                  </li>
                ) : null}
                {phone ? (
                  <li className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    <a
                      href={`tel:${phone.replace(/\s+/g, "")}`}
                      className="hover:text-forest"
                    >
                      {phone}
                    </a>
                  </li>
                ) : null}
                {whatsapp ? (
                  <li className="flex items-start gap-2.5">
                    <MessageCircle
                      className="mt-0.5 size-4 shrink-0 text-forest"
                      aria-hidden
                    />
                    <a
                      href={`https://wa.me/${whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-forest"
                    >
                      WhatsApp
                    </a>
                  </li>
                ) : null}
                {address ? (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    <span>{address}</span>
                  </li>
                ) : null}
              </ul>
            ) : null}

            {showNewsletter ? (
              <div className="mt-8">
                <FooterHeading>Newsletter</FooterHeading>

                <NewsletterForm layout="stacked" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-charcoal/10">
          <div className="container-page flex flex-col gap-2 py-6 text-xs text-charcoal/70 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © <CopyrightYear /> {siteConfig.name}. All rights reserved.
            </p>
            <p className="tracking-wide">{settings.brand.tagline}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
