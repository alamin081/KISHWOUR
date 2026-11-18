import { ArrowRight, Loader2, MessageSquareQuote, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";

import { NewsletterForm } from "@/components/forms/newsletter-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { CategoryCard } from "@/components/products/category-card";
import { ProductCard } from "@/components/products/product-card";
import { CardGridSkeleton } from "@/components/products/skeletons";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { InquiryCta } from "@/components/shared/inquiry-cta";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/site";
import { INITIAL_CATEGORIES } from "@/features/categories/constants";

export const metadata: Metadata = {
  title: "Design system (internal preview)",
  robots: { index: false, follow: false },
};

/** Internal preview of the Kishwour UI system. Hidden in production unless explicitly enabled. */
function previewEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env["ENABLE_DESIGN_PREVIEW"] === "true"
  );
}

const categories = INITIAL_CATEGORIES.map(({ name, slug }) => ({ name, slug }));

/** Preview-only specimens. Not real products; never stored or shown on the live catalog. */
const specimenProducts = [
  {
    slug: "specimen-jute-tote",
    name: "Specimen — Jute Tote Bag",
    shortDescription:
      "Specimen text showing how a two-line product summary wraps inside the card.",
    category: { name: "Jute Products & Bags", slug: "jute-products" },
    material: "Specimen material",
    image: null,
    isCustomizable: true,
  },
  {
    slug: "specimen-leather-sandal",
    name: "Specimen — Handmade Sandal",
    shortDescription:
      "Specimen text. Real names, materials and photos come from the admin dashboard.",
    category: { name: "Footwear", slug: "footwear" },
    material: "Specimen material",
    image: null,
    isCustomizable: false,
  },
  {
    slug: "specimen-basket",
    name: "Specimen — Woven Storage Basket With A Longer Product Name",
    shortDescription: null,
    category: { name: "Handmade Home Décor", slug: "home-decor" },
    material: null,
    image: null,
    isCustomizable: false,
  },
  {
    slug: "specimen-nakshi",
    name: "Specimen — Embroidered Textile",
    shortDescription: "Specimen text for a card without the customisable badge.",
    category: {
      name: "Traditional Handicrafts & Textiles",
      slug: "handicrafts",
    },
    material: "Specimen material",
    image: null,
    isCustomizable: false,
  },
];

const colors = [
  {
    name: "Primary Green",
    token: "--brand-forest · bg-forest / bg-primary",
    hex: "#176B43",
    text: "text-warm-white",
    note: "Warm White on it: 6.0:1",
  },
  {
    name: "Forest Deep",
    token: "--brand-forest-deep · hover",
    hex: "#0F4D30",
    text: "text-warm-white",
    note: "9.2:1",
  },
  {
    name: "Natural Beige",
    token: "--brand-beige · bg-beige / bg-secondary",
    hex: "#E9DFC9",
    text: "text-charcoal",
    note: "Charcoal on it: 10.8:1",
  },
  {
    name: "Warm White",
    token: "--brand-warm-white · bg-background",
    hex: "#F8F6F0",
    text: "text-charcoal",
    note: "Charcoal on it: 13.2:1",
  },
  {
    name: "Jute Brown",
    token: "--brand-jute · text-jute",
    hex: "#A66E43",
    text: "text-warm-white",
    note: "3.9:1 — large text & icons only",
  },
  {
    name: "Jute Deep",
    token: "--brand-jute-deep · text-jute-deep",
    hex: "#7F5230",
    text: "text-warm-white",
    note: "6.2:1 — small text OK",
  },
  {
    name: "Charcoal",
    token: "--brand-charcoal · text-foreground",
    hex: "#292B25",
    text: "text-warm-white",
    note: "Body text",
  },
];

function Block({
  id,
  title,
  children,
  note,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t py-14">
      <div className="container-page">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl">{title}</h2>
          {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function DesignSystemPage() {
  if (!previewEnabled()) notFound();

  return (
    <div className="bg-background">
      <div className="bg-charcoal text-warm-white">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-3 text-xs">
          <p>
            <strong>Kishwour design system</strong> · internal preview (not indexed,
            disabled in production)
          </p>
          <p className="text-warm-white/70">
            Links point to pages that are built in the next phase.
          </p>
        </div>
      </div>

      {/* 1–5: Header, announcement bar, navigation, mega menu, mobile navigation */}
      <SiteHeader categories={categories} sticky={false} />

      <div className="container-page py-14">
        <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-jute-deep uppercase">
          UI system · Phase 03
        </p>
        <h1 className="max-w-3xl text-4xl sm:text-5xl lg:text-6xl">
          Authentic craftsmanship, presented with clarity.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Reusable components for the Kishwour storefront. Hover “Products” in the header
          for the mega menu; narrow the window below 1280px for the mobile menu.
        </p>
        <nav aria-label="Sections" className="mt-8 flex flex-wrap gap-2 text-sm">
          {[
            "colours",
            "typography",
            "buttons",
            "product-card",
            "category-card",
            "headings",
            "breadcrumb",
            "newsletter",
            "inquiry-cta",
            "states",
          ].map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-full border px-3 py-1 capitalize transition-colors hover:border-forest hover:text-forest"
            >
              {id.replace("-", " ")}
            </a>
          ))}
        </nav>
      </div>

      <Block id="colours" title="Colour" note="CSS variables in src/app/globals.css">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {colors.map((c) => (
            <div key={c.hex} className="overflow-hidden rounded-lg border">
              <div
                className={`flex h-24 items-end p-3 text-xs font-semibold ${c.text}`}
                style={{ backgroundColor: c.hex }}
              >
                {c.hex}
              </div>
              <div className="space-y-1 bg-card p-3">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-[0.7rem] leading-snug text-muted-foreground">
                  {c.token}
                </p>
                <p className="text-[0.7rem] text-muted-foreground">{c.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block
        id="typography"
        title="Typography"
        note="Fraunces (headings) · Inter (content)"
      >
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">Display · font-serif · 60px</p>
            <p className="font-serif text-6xl tracking-tight">Made by hand</p>
            <p className="text-xs text-muted-foreground">H1 · 48px</p>
            <p className="font-serif text-5xl tracking-tight">Jute & natural fibre</p>
            <p className="text-xs text-muted-foreground">H2 · 30px</p>
            <p className="font-serif text-3xl tracking-tight">
              From Bangladesh to the world
            </p>
            <p className="text-xs text-muted-foreground">H3 · 20px</p>
            <p className="font-serif text-xl">Traditional handicrafts & textiles</p>
          </div>
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">
              Eyebrow · Inter 12px semibold, tracked
            </p>
            <p className="text-xs font-semibold tracking-[0.2em] text-jute-deep uppercase">
              Wholesale & export
            </p>
            <p className="text-xs text-muted-foreground">Lead · Inter 18px</p>
            <p className="text-lg leading-relaxed">
              Body copy uses Inter for clear reading on every screen size, with
              comfortable line height and a maximum line length of about 70 characters.
            </p>
            <p className="text-xs text-muted-foreground">
              Body · Inter 16px / Small · 14px
            </p>
            <p className="leading-relaxed">
              Product descriptions, specifications and forms are set in Inter at 16px.
            </p>
            <p className="text-sm text-muted-foreground">
              Secondary information and captions use 14px.
            </p>
          </div>
        </div>
      </Block>

      <Block
        id="buttons"
        title="Buttons"
        note="Consistent sizes, subtle colour-only interactions"
      >
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              <MessageSquareQuote aria-hidden /> Primary — Request a Quote
            </Button>
            <Button variant="secondary">
              Secondary — View Details <ArrowRight aria-hidden />
            </Button>
            <Button variant="outline">Outline</Button>
            <Button variant="jute">Jute accent</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Large</Button>
            <Button>Default</Button>
            <Button size="sm">Small</Button>
            <Button size="icon" variant="outline" aria-label="Search">
              <Search aria-hidden />
            </Button>
            <Button disabled>Disabled</Button>
            <Button disabled>
              <Loader2 className="animate-spin" aria-hidden /> Sending…
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-secondary/60 p-4">
            <Button variant="secondary" aria-disabled tabIndex={-1}>
              Alibaba Store
            </Button>
            <p className="text-sm text-muted-foreground">
              Alibaba Store button specimen — shown in the header and footer once the
              store URL is configured (currently not set, so it is hidden there).
            </p>
          </div>
        </div>
      </Block>

      <Block
        id="product-card"
        title="Product card"
        note="4:5 photography · placeholders until real photos are supplied"
      >
        <Badge variant="outline" className="mb-6 border-jute text-jute-deep">
          Specimen data for preview only — not real products
        </Badge>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
          {specimenProducts.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Block>

      <Block id="category-card" title="Category card" note="The six launch categories">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {categories.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </Block>

      <Block id="headings" title="Section heading">
        <SectionHeading
          eyebrow="Our collections"
          title="Handmade for international buyers"
          description="Left-aligned heading with an optional action, used above product and category grids."
          action={
            <Button asChild variant="secondary">
              <Link href={routes.products}>
                View all <ArrowRight aria-hidden />
              </Link>
            </Button>
          }
        />
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="From inquiry to export"
          description="Centred variant for editorial sections."
          className="mt-14"
        />
      </Block>

      <Block
        id="breadcrumb"
        title="Breadcrumb"
        note="Includes BreadcrumbList structured data"
      >
        <Breadcrumbs
          items={[
            { label: "Products", href: routes.products },
            {
              label: "Jute Products & Bags",
              href: routes.category("jute-products"),
            },
            { label: "Current page", href: "/design-system" },
          ]}
        />
      </Block>

      <Block
        id="newsletter"
        title="Newsletter form"
        note="React Hook Form + Zod (client & server)"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border p-6">
            <NewsletterForm />
          </div>
          <div className="rounded-lg bg-forest p-6">
            <NewsletterForm tone="dark" />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Validation works on both client and server. Subscriber storage is not connected
          yet, so the form honestly reports that sign-up is not open and stores nothing.
        </p>
      </Block>

      <section id="inquiry-cta" className="border-t pt-14">
        <div className="container-page mb-8">
          <h2 className="text-2xl">Inquiry CTA</h2>
        </div>
        <InquiryCta />
        <div className="container-page py-10">
          <InquiryCta
            variant="card"
            eyebrow="OEM / ODM"
            title="Have your own design?"
            description="Share your specification and target quantity; we will review it for custom manufacturing."
            primary={{ label: "Request a Quote", href: routes.requestQuote }}
            secondary={{
              label: "Custom manufacturing",
              href: routes.customManufacturing,
            }}
          />
        </div>
      </section>

      <Block id="states" title="Loading, empty & error states">
        <div className="space-y-10">
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Loading skeleton — product grid
            </p>
            <CardGridSkeleton count={4} />
          </div>
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Loading skeleton — category grid
            </p>
            <CardGridSkeleton count={3} variant="category" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <EmptyState
              title="No products found"
              description="Try a different search term or browse all categories."
              action={
                <Button asChild variant="secondary">
                  <Link href={routes.products}>Browse all products</Link>
                </Button>
              }
            />
            <ErrorState
              reference="example-digest"
              action={
                <Button asChild variant="secondary">
                  <Link href={routes.home}>Go to home page</Link>
                </Button>
              }
            />
          </div>
        </div>
      </Block>

      <SiteFooter categories={categories} showNewsletter />
    </div>
  );
}
