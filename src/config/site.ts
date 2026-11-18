import { clientEnv } from "@/lib/env/client";

/**
 * Static brand configuration. Business data (products, categories) lives in the database.
 *
 * Contact details are intentionally empty until real values are provided. Every UI that
 * shows them renders nothing when a value is missing — never fill these with placeholders.
 */
export const siteConfig = {
  name: "Kishwour",
  tagline: "Made in Bangladesh",
  positioning: "Authentic Craftsmanship from Bangladesh to the World.",
  description:
    "Kishwour supplies handmade footwear, jute products, bags, traditional handicrafts and home décor made in Bangladesh to importers and wholesalers worldwide.",
  url: clientEnv.NEXT_PUBLIC_SITE_URL,
  locale: "en_US",
  logo: {
    src: "/brand/kishwour-logo.png",
    width: 1509,
    height: 584,
    alt: "Kishwour — Made in Bangladesh",
  },
  contact: {
    email: undefined as string | undefined,
    phone: undefined as string | undefined,
    /** International format without spaces, e.g. "8801XXXXXXXXX" (used for wa.me links). */
    whatsapp: undefined as string | undefined,
    address: undefined as string | undefined,
  },
  /** Kishwour supplier store on Alibaba.com. */
  alibabaStoreUrl: undefined as string | undefined,
  /** Social profiles. Only configured ones are shown. */
  social: {
    facebook: undefined as string | undefined,
    instagram: undefined as string | undefined,
    linkedin: undefined as string | undefined,
    youtube: undefined as string | undefined,
  },
  /** Feature switches for UI whose backend is not connected yet. */
  features: {
    /** Enable once subscriber storage (DB table or Resend Audiences) is decided. */
    newsletter: false,
  },
  announcement: {
    message: "Wholesale, export and OEM/ODM inquiries welcome — handmade in Bangladesh.",
    link: { label: "Request a quote", href: "/request-quote" },
  },
} as const;

export type SiteConfig = typeof siteConfig;

export type NavItem = { title: string; href: string; description?: string };

/** Routes used by components. Pages for these are built in the pages phase. */
export const routes = {
  home: "/",
  products: "/products",
  categories: "/categories",
  /** Categories share the /products/<slug> namespace with products (slugs must not collide). */
  category: (slug: string) => `/products/${slug}`,
  product: (slug: string) => `/products/${slug}`,
  search: (q: string) => `/products?q=${encodeURIComponent(q)}`,
  catalogPdf: "/catalog.pdf",
  about: "/about",
  craft: "/our-craft",
  sustainability: "/sustainability",
  contact: "/contact",
  wholesale: "/wholesale",
  /** OEM/ODM content lives on the wholesale page. */
  customManufacturing: "/wholesale#custom-manufacturing",
  requestQuote: "/request-quote",
  requestQuoteFor: (productSlug: string) =>
    `/request-quote?product=${encodeURIComponent(productSlug)}`,
  requestSample: "/request-sample",
  requestSampleFor: (productSlug: string) =>
    `/request-sample?product=${encodeURIComponent(productSlug)}`,
  inquiryReceived: (ref: string) => `/inquiry/received?ref=${encodeURIComponent(ref)}`,
} as const;

/** Primary navigation (header + mobile menu). "Products" opens the mega menu. */
export const mainNav: NavItem[] = [
  { title: "Home", href: routes.home },
  { title: "Products", href: routes.products },
  { title: "About Us", href: routes.about },
  { title: "Our Craft", href: routes.craft },
  { title: "Sustainability", href: routes.sustainability },
  { title: "Contact", href: routes.contact },
];

/** Footer quick links. Category links come from the database. */
export const footerQuickLinks: NavItem[] = [
  { title: "All products", href: routes.products },
  { title: "About Us", href: routes.about },
  { title: "Our Craft", href: routes.craft },
  { title: "Sustainability", href: routes.sustainability },
  { title: "Wholesale", href: routes.wholesale },
  { title: "Custom manufacturing (OEM/ODM)", href: routes.customManufacturing },
  { title: "Request a Quote", href: routes.requestQuote },
  { title: "Contact", href: routes.contact },
];

/** Builds an absolute URL for metadata, sitemaps and structured data. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}
