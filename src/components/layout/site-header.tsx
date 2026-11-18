import { ExternalLink, MessageSquareQuote } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/shared/brand-logo";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";
import { getSiteSettings } from "@/features/settings/queries";
import { cn } from "@/lib/utils";

import { AnnouncementBar } from "./announcement-bar";
import { DesktopNav } from "./desktop-nav";
import { HeaderSearch } from "./header-search";
import { MobileNav } from "./mobile-nav";
import { type NavCategory } from "./types";

type SiteHeaderProps = {
  categories: NavCategory[];
  /** Override for previews; defaults to the saved Alibaba store URL (hidden when not set). */
  alibabaStoreUrl?: string;
  showAnnouncement?: boolean;
  /** Sticky positioning; disable when embedding the header in a preview. */
  sticky?: boolean;
};

/**
 * Site header. Layout: logo (left) · navigation with Products mega menu (centre, ≥1280px) ·
 * Search, Request a Quote, Alibaba Store (right). Below 1280px navigation moves into a
 * slide-in mobile menu.
 */
export async function SiteHeader({
  categories,
  alibabaStoreUrl: alibabaOverride,
  showAnnouncement = true,
  sticky = true,
}: SiteHeaderProps) {
  const settings = await getSiteSettings();
  const alibabaStoreUrl = alibabaOverride ?? settings.alibaba.storeUrl;
  const announcement = settings.brand.announcementMessage;
  return (
    <>
      {showAnnouncement && announcement ? (
        <AnnouncementBar message={announcement} />
      ) : null}
      <header
        className={cn(
          "z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
          sticky && "sticky top-0",
        )}
      >
        <div className="container-page flex h-16 items-center gap-4 lg:h-20">
          <div className="flex flex-1 items-center xl:flex-none">
            <BrandLogo height={40} priority asHomeLink />
          </div>

          <div className="hidden flex-1 justify-center xl:flex">
            <DesktopNav categories={categories} />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <HeaderSearch />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href={routes.requestQuote}>
                <MessageSquareQuote aria-hidden /> Request a Quote
              </Link>
            </Button>
            {alibabaStoreUrl ? (
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="hidden xl:inline-flex"
              >
                <a href={alibabaStoreUrl} target="_blank" rel="noopener noreferrer">
                  Alibaba Store <ExternalLink aria-hidden />
                </a>
              </Button>
            ) : null}
            <div className="xl:hidden">
              <MobileNav
                categories={categories}
                alibabaStoreUrl={alibabaStoreUrl}
                tagline={settings.brand.tagline}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
