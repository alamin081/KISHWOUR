import {
  ArrowRight,
  Boxes,
  Check,
  Handshake,
  Leaf,
  Mail,
  MessageCircle,
  MessageSquareQuote,
  Package,
  Palette,
  Scissors,
  Sprout,
} from "lucide-react";
import Link from "next/link";

import { CategoryCard } from "@/components/products/category-card";
import { ProductCard } from "@/components/products/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { MediaSlot, type MediaSlotImage } from "@/components/shared/media-slot";
import { SectionHeading } from "@/components/shared/section-heading";
import { Testimonials } from "@/components/shared/testimonials";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";
import { type VerifiedClaim } from "@/content/site-content";
import { type CategorySummary } from "@/features/categories/types";
import {
  contentParagraphs,
  type HomepageContent,
  type HomepageImage,
} from "@/features/homepage/schema";
import { type HomepageSectionId } from "@/features/homepage/sections";
import { type ProductCardData } from "@/features/products/types";
import { cn } from "@/lib/utils";

/**
 * The homepage, section by section.
 *
 * These components are deliberately pure and free of server-only imports: the public page
 * renders them on the server and the admin editor renders the very same components in its
 * live preview, so what an admin sees is what visitors get.
 */

/** Database-backed content the sections render around the editorial text. */
export type HomepageRenderData = {
  categories: CategorySummary[];
  products: ProductCardData[];
  sustainabilityClaims: VerifiedClaim[];
  /** WhatsApp number from site settings; the button is hidden when empty. */
  whatsapp?: string;
};

type SectionProps<K extends HomepageSectionId> = {
  content: HomepageContent[K];
  data: HomepageRenderData;
  /** True inside the admin editor: no image priority hints, placeholders for empty sections. */
  preview?: boolean;
};

const craftIcons = [Scissors, Palette, Leaf];

/** Adapts a stored image to the `MediaSlot` shape; `null` renders the labelled placeholder. */
function slotImage(image: HomepageImage | null): MediaSlotImage | undefined {
  return image
    ? { src: image.url, alt: image.alt, display: image.display }
    : undefined;
}

function Eyebrow({ children, tone }: { children: string; tone?: "light" }) {
  if (!children) return null;
  return (
    <p
      className={cn(
        "mb-3 text-xs font-semibold tracking-[0.2em] uppercase",
        tone === "light" ? "text-beige" : "text-jute-deep",
      )}
    >
      {children}
    </p>
  );
}

/** Shown in the editor preview where a section would render nothing on the live site. */
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

export function HeroSection({ content, preview }: SectionProps<"hero">) {
  return (
    <section className="container-page grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
      <div>
        {content.eyebrow ? (
          <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-jute-deep uppercase">
            {content.eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
          {content.title}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {content.subtitle}
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={routes.products}>
              {content.primaryCtaLabel} <ArrowRight aria-hidden />
            </Link>
          </Button>
          {content.secondaryCtaLabel ? (
            <Button asChild size="lg" variant="secondary">
              <Link href={routes.wholesale}>
                <Handshake aria-hidden /> {content.secondaryCtaLabel}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
      <MediaSlot
        image={slotImage(content.image)}
        label="Lifestyle photography"
        priority={!preview}
        className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]"
      />
    </section>
  );
}

export function CategoriesSection({ content, data }: SectionProps<"categories">) {
  const { categories } = data;
  return (
    <section aria-labelledby="home-categories" className="border-t py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow={content.eyebrow || undefined}
          title={content.title}
          description={content.description || undefined}
          action={
            categories.length > 0 && content.ctaLabel ? (
              <Button asChild variant="secondary">
                <Link href={routes.categories}>
                  {content.ctaLabel} <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : undefined
          }
        />
        <h2 id="home-categories" className="sr-only">
          Product categories
        </h2>
        {categories.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {categories.map((c) => (
              <CategoryCard key={c.slug} category={c} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Boxes}
            title="Categories are being added"
            description="Our product categories will appear here shortly."
          />
        )}
      </div>
    </section>
  );
}

export function FeaturedSection({ content, data }: SectionProps<"featured">) {
  const { products } = data;
  return (
    <section aria-labelledby="home-featured" className="bg-secondary/40 py-16 sm:py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow={content.eyebrow || undefined}
          title={content.title}
          description={content.description || undefined}
          action={
            products.length > 0 && content.ctaLabel ? (
              <Button asChild variant="secondary">
                <Link href={routes.products}>
                  {content.ctaLabel} <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : undefined
          }
        />
        <h2 id="home-featured" className="sr-only">
          Featured products
        </h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 2} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="Our catalogue is being prepared"
            description="Products will be published here soon. You can already send us a wholesale or custom-manufacturing inquiry."
            action={
              <Button asChild>
                <Link href={routes.requestQuote}>
                  <MessageSquareQuote aria-hidden /> Request a Quote
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </section>
  );
}

export function AboutSection({ content }: SectionProps<"about">) {
  return (
    <section className="container-page grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
      <MediaSlot
        image={slotImage(content.image)}
        label="Brand photography"
        className="aspect-[4/3] lg:order-2"
      />
      <div>
        <Eyebrow>{content.eyebrow}</Eyebrow>
        <h2 className="text-3xl sm:text-4xl">{content.title}</h2>
        {contentParagraphs(content.body).map((p) => (
          <p key={p} className="mt-5 leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
        {content.linkLabel ? (
          <Button asChild variant="link" className="mt-4 px-0 has-[>svg]:px-0">
            <Link href={routes.about}>
              {content.linkLabel} <ArrowRight aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function CraftSection({ content }: SectionProps<"craft">) {
  return (
    <section
      aria-labelledby="home-craft"
      className="bg-charcoal py-16 text-warm-white sm:py-24"
    >
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <Eyebrow tone="light">{content.eyebrow}</Eyebrow>
          <h2 id="home-craft" className="text-3xl text-warm-white sm:text-4xl">
            {content.title}
          </h2>
          <MediaSlot
            image={slotImage(content.image)}
            label="Craft photography"
            className="mt-8 aspect-[4/3]"
          />
        </div>
        <div className="flex flex-col justify-center">
          <ul className="divide-y divide-warm-white/15">
            {content.points.map((point, i) => {
              const Icon = craftIcons[i % craftIcons.length] ?? Leaf;
              return (
                <li key={`${point.title}-${i}`} className="flex gap-5 py-7 first:pt-0">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warm-white/10 text-beige">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-xl text-warm-white">{point.title}</h3>
                    <p className="mt-2 leading-relaxed text-warm-white/75">
                      {point.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {content.ctaLabel ? (
            <div>
              <Button
                asChild
                variant="secondary"
                className="mt-6 border-warm-white/70 text-warm-white hover:bg-warm-white hover:text-charcoal"
              >
                <Link href={routes.craft}>
                  {content.ctaLabel} <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function WholesaleSection({ content }: SectionProps<"wholesale">) {
  return (
    <section aria-labelledby="home-wholesale" className="container-page py-16 sm:py-24">
      <div className="grid gap-10 rounded-2xl bg-forest p-8 text-warm-white sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:p-16">
        <div>
          <Eyebrow tone="light">{content.eyebrow}</Eyebrow>
          <h2 id="home-wholesale" className="text-3xl text-warm-white sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-warm-white/85">
            {content.text}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-warm-white text-forest hover:bg-beige"
            >
              <Link href={routes.requestQuote}>
                <MessageSquareQuote aria-hidden /> {content.primaryCtaLabel}
              </Link>
            </Button>
            {content.secondaryCtaLabel ? (
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="border-warm-white/70 text-warm-white hover:bg-warm-white hover:text-forest"
              >
                <Link href={routes.wholesale}>
                  {content.secondaryCtaLabel} <ArrowRight aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
        {content.points.length > 0 ? (
          <ul className="grid content-center gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {content.points.map((p, i) => (
              <li
                key={`${p}-${i}`}
                className="flex items-center gap-3 rounded-lg bg-warm-white/10 px-5 py-4 font-medium"
              >
                <Check className="size-5 shrink-0 text-beige" aria-hidden /> {p}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function CustomManufacturingSection({
  content,
}: SectionProps<"customManufacturing">) {
  return (
    <section aria-labelledby="home-oem" className="border-t py-16 sm:py-24">
      <div className="container-page grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="home-oem" className="text-3xl sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">{content.text}</p>
          {content.ctaLabel ? (
            <Button asChild variant="secondary" className="mt-8">
              <Link href={routes.customManufacturing}>
                {content.ctaLabel} <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
        {content.options.length > 0 ? (
          <div>
            {content.optionsHeading ? (
              <h3 className="mb-4 font-sans text-sm font-semibold tracking-wide text-muted-foreground">
                {content.optionsHeading}
              </h3>
            ) : null}
            <ul className="divide-y border-y">
              {content.options.map((o, i) => (
                <li key={`${o}-${i}`} className="flex items-center gap-3 py-4">
                  <Check className="size-4 shrink-0 text-forest" aria-hidden />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function SustainabilitySection({ content, data }: SectionProps<"sustainability">) {
  return (
    <section
      aria-labelledby="home-sustainability"
      className="bg-secondary/50 py-16 sm:py-24"
    >
      <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <MediaSlot
          image={slotImage(content.image)}
          label="Material photography"
          className="aspect-[4/3]"
        />
        <div>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 id="home-sustainability" className="text-3xl sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">{content.text}</p>
          {data.sustainabilityClaims.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {data.sustainabilityClaims.map((c) => (
                <li key={c.title} className="flex gap-3">
                  <Sprout className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
                  <span>
                    <strong className="font-semibold">{c.title}.</strong> {c.description}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {content.linkLabel ? (
            <Button asChild variant="link" className="mt-4 px-0 has-[>svg]:px-0">
              <Link href={routes.sustainability}>
                {content.linkLabel} <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection({ content, preview }: SectionProps<"testimonials">) {
  if (content.items.length === 0) {
    return preview ? (
      <PreviewNotice
        title="Testimonials are hidden on the live site"
        description="This section appears once you add a real testimonial. Open it to add one."
      />
    ) : null;
  }
  return (
    <Testimonials
      eyebrow={content.eyebrow || undefined}
      title={content.title}
      items={content.items}
    />
  );
}

/**
 * Closing call to action. Also used by the About, Our Craft, Wholesale and Sustainability
 * pages through the `ContactCta` server wrapper.
 */
export function ContactCtaView({
  title,
  text,
  primaryCtaLabel,
  secondaryCtaLabel,
  whatsappLabel,
  whatsapp,
  className,
}: {
  title: string;
  text: string;
  primaryCtaLabel: string;
  secondaryCtaLabel?: string;
  whatsappLabel?: string;
  whatsapp?: string;
  className?: string;
}) {
  return (
    <section className={cn("container-page py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl sm:text-4xl">{title}</h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{text}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={routes.requestQuote}>
              <MessageSquareQuote aria-hidden /> {primaryCtaLabel}
            </Link>
          </Button>
          {secondaryCtaLabel ? (
            <Button asChild size="lg" variant="secondary">
              <Link href={routes.contact}>
                <Mail aria-hidden /> {secondaryCtaLabel}
              </Link>
            </Button>
          ) : null}
          {whatsapp && whatsappLabel ? (
            <Button asChild size="lg" variant="outline">
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden /> {whatsappLabel}
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ContactSection({ content, data }: SectionProps<"contact">) {
  return (
    <ContactCtaView
      title={content.title}
      text={content.text}
      primaryCtaLabel={content.primaryCtaLabel}
      secondaryCtaLabel={content.secondaryCtaLabel || undefined}
      whatsappLabel={content.whatsappLabel || undefined}
      whatsapp={data.whatsapp}
    />
  );
}

/** Renders one section by ID. Visibility and ordering are decided by the caller. */
export function HomepageSection({
  id,
  content,
  data,
  preview = false,
}: {
  id: HomepageSectionId;
  content: HomepageContent;
  data: HomepageRenderData;
  preview?: boolean;
}) {
  switch (id) {
    case "hero":
      return <HeroSection content={content.hero} data={data} preview={preview} />;
    case "categories":
      return (
        <CategoriesSection content={content.categories} data={data} preview={preview} />
      );
    case "featured":
      return <FeaturedSection content={content.featured} data={data} preview={preview} />;
    case "about":
      return <AboutSection content={content.about} data={data} preview={preview} />;
    case "craft":
      return <CraftSection content={content.craft} data={data} preview={preview} />;
    case "wholesale":
      return (
        <WholesaleSection content={content.wholesale} data={data} preview={preview} />
      );
    case "customManufacturing":
      return (
        <CustomManufacturingSection
          content={content.customManufacturing}
          data={data}
          preview={preview}
        />
      );
    case "sustainability":
      return (
        <SustainabilitySection
          content={content.sustainability}
          data={data}
          preview={preview}
        />
      );
    case "testimonials":
      return (
        <TestimonialsSection
          content={content.testimonials}
          data={data}
          preview={preview}
        />
      );
    case "contact":
      return <ContactSection content={content.contact} data={data} preview={preview} />;
  }
}
