import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** Rendered height in pixels; width follows the logo's aspect ratio. */
  height?: number;
  priority?: boolean;
  /** Wrap the logo in a link to the home page. */
  asHomeLink?: boolean;
};

/** The original Kishwour logo. Do not recolour, crop or restyle it. */
export function BrandLogo({
  className,
  height = 48,
  priority = false,
  asHomeLink = false,
}: BrandLogoProps) {
  const { src, width: w, height: h, alt } = siteConfig.logo;
  const width = Math.round((w / h) * height);

  const image = (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto select-none", className)}
      style={{ width, maxWidth: "100%" }}
    />
  );

  if (!asHomeLink) return image;

  return (
    <Link href="/" aria-label={`${siteConfig.name} home`} className="inline-flex">
      {image}
    </Link>
  );
}
