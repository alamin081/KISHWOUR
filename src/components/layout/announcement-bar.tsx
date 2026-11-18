import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type AnnouncementBarProps = {
  message: string;
  link?: { label: string; href: string } | null;
  className?: string;
};

/** Thin brand bar above the header for a single, short business message. */
export function AnnouncementBar({
  message,
  link = siteConfig.announcement.link,
  className,
}: AnnouncementBarProps) {
  return (
    <div className={cn("bg-forest text-warm-white", className)}>
      <div className="container-page flex min-h-9 items-center justify-center gap-x-3 py-2 text-center text-xs sm:text-[0.8rem]">
        <p className="tracking-wide">{message}</p>
        {link ? (
          <Link
            href={link.href}
            className="hidden shrink-0 font-semibold underline underline-offset-4 hover:no-underline sm:inline"
          >
            {link.label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
