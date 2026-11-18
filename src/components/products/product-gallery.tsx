"use client";

import Image from "next/image";
import { useState } from "react";

import { type ImageData } from "@/features/products/types";
import { cn } from "@/lib/utils";

import { ImagePlaceholder } from "./image-placeholder";

/** Main image + thumbnails. Falls back to a labelled placeholder when there are no photos. */
export function ProductGallery({
  images,
  productName,
}: {
  images: ImageData[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-secondary">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <ImagePlaceholder subject={productName} />
        )}
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === active}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-md border-2 bg-secondary transition-colors",
                  i === active
                    ? "border-forest"
                    : "border-transparent hover:border-beige",
                )}
              >
                <Image src={img.url} alt="" fill sizes="100px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
