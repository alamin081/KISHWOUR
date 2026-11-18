/**
 * Editorial content for the public website — one place to review and edit.
 *
 * RULES (from the project brief):
 * - No invented company history, production capacity, certifications or statistics.
 * - Artisan stories and environmental claims are published ONLY when approved / verified:
 *   add them to the arrays below. Empty arrays hide the related UI.
 * - Testimonials moved into the Homepage editor (/admin/pages/home) and live in the
 *   database; only real, permitted quotes may be published there.
 * - Photography: set a path under /public (e.g. "/images/hero.jpg") once real photos exist.
 *   `undefined` renders a clearly labelled placeholder — never a stock or generated image.
 *
 * Copy below is DRAFT for owner approval. It describes what Kishwour offers (per the project
 * brief) and general, well-established facts about materials and Bangladeshi craft traditions.
 */

export type ContentImage = { src: string; alt: string; width: number; height: number };

export type Testimonial = {
  quote: string;
  name: string;
  /** e.g. "Purchasing Manager, Company Name, Germany" */
  role: string;
};

export type VerifiedClaim = {
  title: string;
  description: string;
  /** Where the claim was verified (certificate, test report, supplier document). Not shown. */
  evidence: string;
};

export type ArtisanStory = {
  name: string;
  craft: string;
  story: string;
  image?: ContentImage;
};

/** Real photography. Leave undefined until approved photos are supplied. */
export const images: Record<
  "hero" | "about" | "craft" | "wholesale" | "sustainability",
  ContentImage | undefined
> = {
  hero: undefined,
  about: undefined,
  craft: undefined,
  wholesale: undefined,
  sustainability: undefined,
};

/** Verified environmental claims only (each with its evidence). */
export const verifiedSustainabilityClaims: VerifiedClaim[] = [];

/** Approved artisan profiles only (with their consent). */
export const artisanStories: ArtisanStory[] = [];

export const homeContent = {
  hero: {
    eyebrow: "Made in Bangladesh",
    title: "Authentic Craftsmanship from Bangladesh to the World.",
    subtitle:
      "Discover thoughtfully handcrafted footwear, jute products, bags and traditional lifestyle products made in Bangladesh.",
  },
  about: {
    eyebrow: "About Kishwour",
    title: "Bangladeshi craftsmanship for international buyers",
    body: [
      "Kishwour brings handmade products from Bangladesh to importers, wholesalers and brands around the world — from footwear and jute bags to traditional handicrafts and home décor.",
      "Bangladesh has long traditions of working with jute, natural fibres, textiles and leather by hand. Kishwour presents these crafts with the clarity and reliability international buyers need: clear specifications, quotations and communication.",
    ],
  },
  craft: {
    eyebrow: "Our Craft",
    title: "Made by hand, piece by piece",
    points: [
      {
        title: "Handmade production",
        text: "Our products are made by hand, so small variations in weave, stitch and colour are part of each piece's character.",
      },
      {
        title: "Traditional techniques",
        text: "Weaving, braiding, stitching and embroidery techniques passed down in Bangladesh's craft communities.",
      },
      {
        title: "Natural materials",
        text: "Jute and other natural fibres are at the heart of many of our product lines.",
      },
    ],
  },
  wholesale: {
    eyebrow: "Wholesale partnership",
    title: "Become a wholesale partner",
    text: "We work with importers, wholesalers, retailers and brands. Tell us your product, quantity and destination, and we will prepare a quotation.",
    points: ["Bulk orders", "Customisation", "Private label", "Sample requests"],
  },
  customManufacturing: {
    eyebrow: "Custom manufacturing · OEM / ODM",
    title: "Your design, made in Bangladesh",
    text: "Share your design or specification and we will review it for production. Every custom request is assessed individually — we confirm what is feasible before quoting.",
    options: [
      "Materials and finishes",
      "Sizes and dimensions",
      "Colours and patterns",
      "Your branding: labels, tags and logos",
      "Packaging",
    ],
  },
  sustainability: {
    eyebrow: "Natural materials",
    title: "Rooted in natural fibres",
    text: "Many of our product lines are made from jute and other natural fibres. Material details for each product are listed on its product page.",
  },
  contact: {
    title: "Let's talk about your next order",
    text: "Request a quotation, ask a question, or reach us directly.",
  },
} as const;

export const aboutContent = {
  intro: {
    title: "About Kishwour",
    description:
      "An international export and e-commerce brand for handmade products from Bangladesh.",
  },
  sections: [
    {
      id: "introduction",
      eyebrow: "Company introduction",
      title: "Who we are",
      body: [
        "Kishwour is a Bangladeshi export brand for handmade footwear, jute products and bags, handmade bags and accessories, traditional handicrafts and textiles, home décor and natural-fibre products.",
        "We focus on business buyers — importers, wholesalers, retailers and brands — and support wholesale orders, custom manufacturing (OEM/ODM) and sample requests.",
      ],
    },
    {
      id: "story",
      eyebrow: "Brand story",
      title: "Made in Bangladesh",
      body: [
        "Our name stands beside a simple promise in our logo: Made in Bangladesh. We want buyers around the world to see Bangladeshi handmade products the way we do — authentic, characterful and made with skill.",
        "Kishwour was created to connect this craftsmanship with international markets through a clear catalogue, transparent quotations and reliable communication.",
      ],
    },
    {
      id: "mission",
      eyebrow: "Mission and vision",
      title: "Authentic craftsmanship from Bangladesh to the world",
      body: [
        "Mission: to make it straightforward for international businesses to source authentic handmade products from Bangladesh.",
        "Vision: a recognised international brand for Bangladeshi craftsmanship — for business buyers today and, in future, for customers who buy directly.",
      ],
    },
    {
      id: "philosophy",
      eyebrow: "Product philosophy",
      title: "Character over uniformity",
      body: [
        "Handmade products carry the marks of the hands that made them. We describe materials, dimensions and finishes clearly so buyers know exactly what to expect, and we agree specifications before production.",
      ],
    },
    {
      id: "craftsmanship",
      eyebrow: "Bangladesh craftsmanship",
      title: "A living craft tradition",
      body: [
        "Bangladesh is one of the world's major jute-growing countries, and working with jute and other natural fibres by hand is part of its everyday culture. Hand-stitched textiles, woven baskets and handmade footwear continue that tradition today.",
      ],
    },
  ],
} as const;

export const craftContent = {
  intro: {
    title: "Our Craft",
    description:
      "How handmade products from Bangladesh are made — and what that means for you.",
  },
  sections: [
    {
      id: "handmade",
      title: "Handmade production",
      body: "Our products are made by hand rather than on automated lines. This allows natural materials, traditional techniques and custom details — and it means every piece is slightly unique.",
    },
    {
      id: "artisans",
      title: "Artisan craftsmanship",
      body: "Handmade products depend on the skill of the people who make them: braiding and weaving fibre, cutting and stitching, embroidering and finishing by hand.",
    },
    {
      id: "materials",
      title: "Materials",
      body: "Jute and other natural fibres, textiles and other materials appropriate to each product line. The exact materials of each product are listed on its product page and confirmed in each quotation.",
    },
  ],
  process: [
    {
      title: "Specification",
      text: "Product, materials, size, colour, branding and quantity are agreed.",
    },
    {
      title: "Sample",
      text: "A sample can be requested to confirm the design before bulk production.",
    },
    {
      title: "Handcrafting",
      text: "Products are made by hand to the agreed specification.",
    },
    {
      title: "Checking",
      text: "Finished goods are checked against the agreed specification and sample.",
    },
    {
      title: "Packing & dispatch",
      text: "Goods are packed as agreed and prepared for export.",
    },
  ],
  quality: {
    title: "Product quality",
    body: "For wholesale orders, the agreed specification and approved sample are the reference for quality. Because products are handmade, small natural variations are normal; anything beyond the agreed tolerances is discussed before dispatch.",
  },
} as const;

export const sustainabilityContent = {
  intro: {
    title: "Sustainability",
    description: "Natural materials and handmade production — described honestly.",
  },
  sections: [
    {
      id: "natural-materials",
      title: "Natural materials",
      body: "Many of our product lines are made from plant fibres such as jute. Each product page lists its materials, including any non-natural components such as linings, trims or fastenings.",
    },
    {
      id: "jute",
      title: "Jute and fibre products",
      body: "Jute is a plant fibre grown widely in Bangladesh, and it has been used for bags, mats and household goods for generations. It is valued for its strength and natural texture.",
    },
    {
      id: "reusable",
      title: "Reusable products",
      body: "Products such as jute shopping bags and storage baskets are made to be used again and again, as an everyday alternative to single-use items.",
    },
    {
      id: "responsible-craftsmanship",
      title: "Responsible craftsmanship",
      body: "Handmade production supports traditional skills. We aim to work responsibly and will publish specific commitments here once they can be verified.",
    },
  ],
  claimsPolicy:
    "We only publish environmental claims we can verify. Product-specific material information is shown on each product page.",
} as const;

export const wholesaleContent = {
  intro: {
    eyebrow: "Wholesale",
    title: "International wholesale",
    description:
      "Handmade products from Bangladesh for importers, wholesalers, retailers and brands.",
  },
  offerings: [
    {
      id: "bulk-orders",
      title: "Bulk orders",
      text: "Order from our catalogue in wholesale quantities. Minimum order quantities and lead times are listed per product where available and confirmed in each quotation.",
    },
    {
      id: "customisation",
      title: "Customisation",
      text: "Adjust materials, sizes, colours or finishes of catalogue products. Feasibility is confirmed for each request before quoting.",
    },
    {
      id: "private-label",
      title: "Private label",
      text: "Products with your brand — labels, tags, logos and packaging — subject to review of your requirements.",
    },
    {
      id: "samples",
      title: "Sample requests",
      text: "Request samples to evaluate quality and design before placing a bulk order. Sample terms are confirmed per request.",
    },
  ],
  steps: [
    {
      title: "Send your inquiry",
      text: "Product, quantity, destination and any customisation.",
    },
    { title: "Receive a quotation", text: "Pricing and terms for your order." },
    {
      title: "Approve a sample",
      text: "Optional, recommended for new and custom products.",
    },
    { title: "Production & export", text: "Handmade production and dispatch as agreed." },
  ],
} as const;
