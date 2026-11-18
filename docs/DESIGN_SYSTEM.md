# Kishwour Design System

Premium, minimal, editorial. Natural materials and handmade craft lead; the interface stays
quiet. Preview every component at **`/design-system`** (development, or production with
`ENABLE_DESIGN_PREVIEW=true`; never indexed).

## Foundations

### Colour (CSS variables in `src/app/globals.css`)

| Token                 | Hex       | Tailwind                           | Use                                  |
| --------------------- | --------- | ---------------------------------- | ------------------------------------ |
| `--brand-forest`      | `#176B43` | `bg-forest`, `bg-primary`          | Primary actions, announcement, links |
| `--brand-forest-deep` | `#0F4D30` | `bg-forest-deep`                   | Primary hover                        |
| `--brand-beige`       | `#E9DFC9` | `bg-beige`, `bg-secondary`         | Panels, footer, image placeholders   |
| `--brand-warm-white`  | `#F8F6F0` | `bg-warm-white`, `bg-background`   | Page background                      |
| `--brand-jute`        | `#A66E43` | `text-jute`                        | Large accents and icons only (3.9:1) |
| `--brand-jute-deep`   | `#7F5230` | `text-jute-deep`, `bg-jute-deep`   | Eyebrows, small accent text (6.2:1)  |
| `--brand-charcoal`    | `#292B25` | `text-charcoal`, `text-foreground` | Body text (13.2:1)                   |

All text/background pairs used by components meet WCAG AA (≥ 4.5:1 for body text).

### Typography

- **Fraunces** (variable, optical sizing) — `font-serif`, applied automatically to `h1`–`h4`.
- **Inter** — `font-sans`, all content, UI and forms.
- Eyebrow style: `text-xs font-semibold tracking-[0.2em] uppercase text-jute-deep`.
- Body 16px, secondary 14px, max line length ≈ 70 characters (`max-w-2xl`).

### Layout

- `container-page` — max width 80rem with 16/24/32px side padding.
- Sections: `py-14`–`py-20`. Product grid: 2 → 3 → 4 columns (`md`, `xl`). Category grid:
  1 → 2 → 3 columns.
- Radius: `--radius` 0.5rem (cards `rounded-lg`, panels `rounded-xl`).
- Motion: colour transitions (200 ms) and a slow 3% image zoom on card hover; all motion is
  disabled under `prefers-reduced-motion`.

## Components

| #   | Component         | File                                               | Notes                                                                       |
| --- | ----------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | Header            | `components/layout/site-header.tsx`                | Logo · nav (≥1280px) · Search, Request a Quote, Alibaba Store               |
| 2   | Announcement bar  | `components/layout/announcement-bar.tsx`           | Message + link from `siteConfig.announcement`                               |
| 3   | Navigation menu   | `components/layout/desktop-nav.tsx`                | Radix NavigationMenu, active-route underline                                |
| 4   | Mega menu         | `components/layout/desktop-nav.tsx` (`MegaMenu`)   | Categories + OEM/ODM panel                                                  |
| 5   | Mobile navigation | `components/layout/mobile-nav.tsx`                 | Slide-in sheet, Products accordion, CTA                                     |
| 6   | Footer            | `components/layout/site-footer.tsx`                | Inquiry band, categories, quick links, contact, social, newsletter          |
| 7   | Primary button    | `components/ui/button.tsx` (`variant="default"`)   | Forest fill                                                                 |
| 8   | Secondary button  | `components/ui/button.tsx` (`variant="secondary"`) | Charcoal outline → fill on hover                                            |
| 9   | Product card      | `components/products/product-card.tsx`             | Image, category, name, material, description, View Details, Request a Quote |
| 10  | Category card     | `components/products/category-card.tsx`            | Image or labelled placeholder, product count                                |
| 11  | Section heading   | `components/shared/section-heading.tsx`            | Left (with action) or centred                                               |
| 12  | Breadcrumb        | `components/shared/breadcrumbs.tsx`                | Includes BreadcrumbList JSON-LD                                             |
| 13  | Newsletter form   | `components/forms/newsletter-form.tsx`             | RHF + Zod, server action; storage not connected yet                         |
| 14  | Inquiry CTA       | `components/shared/inquiry-cta.tsx`                | `band` and `card` variants                                                  |
| 15  | Loading skeleton  | `components/products/skeletons.tsx`                | Product / category cards and grids                                          |
| 16  | Empty state       | `components/shared/empty-state.tsx`                | Icon, message, optional action                                              |
| 17  | Error state       | `components/shared/error-state.tsx`                | Retry callback, reference digest; used by `app/error.tsx`                   |

Other: `ImagePlaceholder` (clearly labelled "Photo coming soon"), `SocialLinks`, `JsonLd`,
`PageHeader`, `BrandLogo`.

## Rules

- **Logo:** always `BrandLogo`; never recolour, crop or redraw.
- **Imagery:** real product photography only. Until supplied, use `ImagePlaceholder` — never
  stock or AI-generated images presented as products.
- **Business details** (contact, Alibaba URL, social links) come from `siteConfig`; anything not
  configured is hidden, never filled with placeholders.
- **Buttons:** one primary action per view area; Request a Quote is the primary CTA.
- **Accessibility:** visible focus rings, labelled icon buttons, `aria-live` for form results,
  keyboard-operable menus (Radix), sufficient contrast.
