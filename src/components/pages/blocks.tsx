import {
  ArrowRight,
  Check,
  Info,
  MessageSquareQuote,
  Package,
  Palette,
  ShieldCheck,
  Sprout,
  Tag,
  Truck,
} from "lucide-react";
import Link from "next/link";

import { ContactCtaView } from "@/components/homepage/sections";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EditorialSection } from "@/components/shared/editorial-section";
import { MediaSlot, type MediaSlotImage } from "@/components/shared/media-slot";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";
import { contentParagraphs, type HomepageImage } from "@/features/homepage/schema";
import { type PageBlock, type PageDocument } from "@/features/pages/blocks";
import { cn } from "@/lib/utils";

/**
 * Renders the blocks of an editable page.
 *
 * The public pages and the admin preview use exactly these components, so what an admin
 * sees in the editor is what visitors get. Pure and free of server-only imports.
 */

export type PageRenderData = {
  /** The single breadcrumb for this page. */
  breadcrumb: { label: string; href: string };
  /** Closing call-to-action wording, owned by the Homepage editor's Contact section. */
  contact: {
    title: string;
    text: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
    whatsappLabel: string;
  };
  /** WhatsApp number from site settings; the button is hidden when empty. */
  whatsapp?: string;
};

function slotImage(image: HomepageImage | null): MediaSlotImage | undefined {
  return image
    ? { src: image.url, alt: image.alt, display: image.display }
    : undefined;
}

/** Shown in the editor preview where a block would render nothing on the live site. */
function PreviewNotice({ title, description }: { title: string; description: string }) {
  return (
    <div className="container-page py-12">
      <div className="rounded-xl border border-dashed bg-secondary/40 p-8 text-center">
        <p className="font-sans text-sm font-semibold">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* Icons and quote links for the wholesale cards, matched on the card's ID. */
const CARD_ICONS: Record<string, typeof Package> = {
  "bulk-orders": Package,
  customisation: Palette,
  "private-label": Tag,
  samples: Truck,
};
const CARD_QUOTE_TYPE: Record<string, string> = {
  "bulk-orders": "wholesale",
  customisation: "oem_odm",
  "private-label": "oem_odm",
  samples: "sample_request",
};

export function PageBlockView({
  block,
  data,
  preview = false,
}: {
  block: PageBlock;
  data: PageRenderData;
  preview?: boolean;
}) {
  switch (block.type) {
    case "header":
      return (
        <PageHeader
          eyebrow={block.eyebrow || undefined}
          title={block.title}
          description={block.description || undefined}
        >
          <Breadcrumbs items={[data.breadcrumb]} />
        </PageHeader>
      );

    case "hero":
      return (
        <section className="border-b">
          <div className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
            <div>
              <Breadcrumbs items={[data.breadcrumb]} />
              {block.eyebrow ? (
                <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-jute-deep uppercase">
                  {block.eyebrow}
                </p>
              ) : null}
              <h1 className="text-4xl sm:text-5xl">{block.title}</h1>
              {block.description ? (
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                  {block.description}
                </p>
              ) : null}
              {block.primaryCtaLabel || block.secondaryCtaLabel ? (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {block.primaryCtaLabel ? (
                    <Button asChild size="lg">
                      <Link href={routes.requestQuote}>
                        <MessageSquareQuote aria-hidden /> {block.primaryCtaLabel}
                      </Link>
                    </Button>
                  ) : null}
                  {block.secondaryCtaLabel ? (
                    <Button asChild size="lg" variant="secondary">
                      <Link href={routes.products}>{block.secondaryCtaLabel}</Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <MediaSlot
              image={slotImage(block.image)}
              label="Wholesale photography"
              priority={!preview}
              className="aspect-[4/3]"
            />
          </div>
        </section>
      );

    case "editorial":
      return (
        <EditorialSection
          id={block.id}
          eyebrow={block.eyebrow || undefined}
          title={block.title}
          body={contentParagraphs(block.body)}
          tone={block.tone}
          reverse={block.reverse}
          media={
            block.mediaLabel
              ? { image: slotImage(block.image), label: block.mediaLabel }
              : undefined
          }
        />
      );

    case "cards":
      if (block.items.length === 0) {
        return preview ? (
          <PreviewNotice
            title="No cards yet"
            description="This section is hidden on the live site until you add a card."
          />
        ) : null;
      }
      return (
        <section aria-labelledby={`${block.id}-heading`} className="py-16 sm:py-24">
          <div className="container-page">
            <h2 id={`${block.id}-heading`} className="sr-only">
              {block.title}
            </h2>
            <SectionHeading
              eyebrow={block.eyebrow || undefined}
              title={block.title}
              description={block.description || undefined}
            />
            <div className="grid gap-6 md:grid-cols-2">
              {block.items.map((item) => {
                const Icon = CARD_ICONS[item.id] ?? Package;
                return (
                  <article
                    key={item.id}
                    id={item.id}
                    className="flex scroll-mt-28 flex-col rounded-xl border bg-card p-7"
                  >
                    <Icon className="size-7 text-forest" strokeWidth={1.5} aria-hidden />
                    <h3 className="mt-5 text-2xl">{item.title}</h3>
                    <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                    <Link
                      href={
                        item.id === "samples"
                          ? routes.requestSample
                          : `${routes.requestQuote}?type=${CARD_QUOTE_TYPE[item.id] ?? "wholesale"}`
                      }
                      className="mt-5 text-sm font-semibold text-forest hover:underline"
                    >
                      Request a quote for {item.title.toLowerCase()} →
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      );

    case "steps": {
      if (block.items.length === 0) {
        return preview ? (
          <PreviewNotice
            title="No steps yet"
            description="This section is hidden on the live site until you add a step."
          />
        ) : null;
      }
      const dark = block.tone === "dark";
      return (
        <section
          id={block.id}
          aria-labelledby={`${block.id}-heading`}
          className={cn(
            "scroll-mt-28 py-16 sm:py-24",
            dark && "bg-charcoal text-warm-white",
          )}
        >
          <div className="container-page">
            {block.centered ? (
              <>
                <h2 id={`${block.id}-heading`} className="sr-only">
                  {block.title}
                </h2>
                <SectionHeading
                  eyebrow={block.eyebrow || undefined}
                  title={block.title}
                  align="center"
                />
              </>
            ) : (
              <>
                {block.eyebrow ? (
                  <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-beige uppercase">
                    {block.eyebrow}
                  </p>
                ) : null}
                <h2
                  id={`${block.id}-heading`}
                  className={cn("text-3xl sm:text-4xl", dark && "text-warm-white")}
                >
                  {block.title}
                </h2>
              </>
            )}
            <ol
              className={cn(
                "grid gap-8 sm:grid-cols-2",
                block.centered ? "lg:grid-cols-4" : "mt-12 lg:grid-cols-5",
              )}
            >
              {block.items.map((item, index) => (
                <li
                  key={item.id}
                  className={cn("border-t pt-5", dark && "border-warm-white/20")}
                >
                  <span
                    className={cn(
                      "font-serif text-3xl",
                      dark ? "text-beige" : "text-jute",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3
                    className={cn(
                      "mt-3 font-sans text-base font-semibold",
                      dark && "text-warm-white",
                    )}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-relaxed",
                      dark ? "text-warm-white/75" : "text-muted-foreground",
                    )}
                  >
                    {item.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      );
    }

    case "checklist":
      return (
        <section
          id={block.id}
          aria-labelledby={`${block.id}-heading`}
          className={cn(
            "scroll-mt-28 py-16 sm:py-24",
            block.tone === "muted" ? "bg-secondary/50" : "border-t",
          )}
        >
          <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              {block.eyebrow ? (
                <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-jute-deep uppercase">
                  {block.eyebrow}
                </p>
              ) : null}
              <h2 id={`${block.id}-heading`} className="text-3xl sm:text-4xl">
                {block.title}
              </h2>
              {block.text ? (
                <p className="mt-5 leading-relaxed text-muted-foreground">{block.text}</p>
              ) : null}
              {block.ctaLabel ? (
                <Button asChild className="mt-8">
                  <Link href={`${routes.requestQuote}?type=oem_odm`}>
                    <MessageSquareQuote aria-hidden /> {block.ctaLabel}
                  </Link>
                </Button>
              ) : null}
            </div>
            {block.items.length > 0 ? (
              <ul className="divide-y rounded-xl border bg-card px-6">
                {block.items.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-center gap-3 py-4">
                    <Check className="size-4 shrink-0 text-forest" aria-hidden /> {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      );

    case "claims":
      if (block.items.length === 0) {
        return preview ? (
          <PreviewNotice
            title="No verified commitments yet"
            description="This section stays hidden until you add a commitment you can evidence."
          />
        ) : null;
      }
      return (
        <section
          aria-labelledby={`${block.id}-heading`}
          className="container-page py-14 sm:py-20"
        >
          <h2 id={`${block.id}-heading`} className="text-3xl sm:text-4xl">
            {block.title}
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {block.items.map((item) => (
              <li key={item.id} className="flex gap-4 rounded-lg border bg-card p-6">
                <Sprout className="size-6 shrink-0 text-forest" aria-hidden />
                <div>
                  <h3 className="text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      );

    case "note":
      return (
        <div className="container-page pb-6">
          <p className="flex items-start gap-2.5 border-t pt-8 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
            {block.text}
          </p>
        </div>
      );

    case "callout":
      return (
        <section
          id={block.id}
          aria-labelledby={`${block.id}-heading`}
          className="container-page scroll-mt-28 py-16 sm:py-20"
        >
          <div className="flex flex-col gap-6 rounded-xl bg-secondary/60 p-8 sm:flex-row sm:p-12">
            <ShieldCheck
              className="size-10 shrink-0 text-forest"
              strokeWidth={1.5}
              aria-hidden
            />
            <div>
              <h2 id={`${block.id}-heading`} className="text-2xl sm:text-3xl">
                {block.title}
              </h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
                {block.text}
              </p>
            </div>
          </div>
        </section>
      );

    case "cta":
      return (
        <ContactCtaView
          title={data.contact.title}
          text={data.contact.text}
          primaryCtaLabel={data.contact.primaryCtaLabel}
          secondaryCtaLabel={data.contact.secondaryCtaLabel || undefined}
          whatsappLabel={data.contact.whatsappLabel || undefined}
          whatsapp={data.whatsapp}
          className={block.bordered ? "border-t" : undefined}
        />
      );
  }
}

/** The whole page: visible blocks, in order. */
export function PageBlocks({
  document,
  data,
  preview = false,
}: {
  document: PageDocument;
  data: PageRenderData;
  preview?: boolean;
}) {
  return (
    <>
      {document.blocks
        .filter((block) => block.visible)
        .map((block) => (
          <PageBlockView key={block.id} block={block} data={data} preview={preview} />
        ))}
    </>
  );
}

/** A small arrow link used by the editor's "manage elsewhere" hints. */
export function InlineLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
    >
      {children} <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}
