# Kishwour

**Made in Bangladesh — Authentic Craftsmanship from Bangladesh to the World.**

Kishwour is an international export and e-commerce platform for handmade products from
Bangladesh: footwear, jute products and bags, handmade bags and accessories, traditional
handicrafts and textiles, home décor, and natural-fibre products.

The platform is **B2B-first** (wholesale catalog, importer inquiries, OEM/ODM requests,
quotations) and is architected so that **B2C retail** can be added later without
restructuring.

> **Status:** Phase 1 (setup), Phase 2 (Neon + Prisma) complete; Phase 3 (UI design system)
> ready for review — see [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) and `/design-system`.
> The initial migration is applied to the Neon production branch; no data has been seeded yet.
> See [Roadmap](#roadmap).

---

## Tech stack

| Layer          | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Cache Components, Turbopack)       |
| Language       | TypeScript (strict, `noUncheckedIndexedAccess`)            |
| UI             | Tailwind CSS 4, shadcn/ui (Radix primitives), Lucide icons |
| Backend        | Server Actions, Route Handlers (Node.js runtime)           |
| Database       | Neon PostgreSQL + Prisma ORM 7 (`@prisma/adapter-pg`)      |
| Validation     | Zod 4 (+ React Hook Form for client forms)                 |
| Authentication | Auth.js (later phase)                                      |
| Media          | Cloudinary (later phase)                                   |
| Email          | Resend (later phase)                                       |
| Testing        | Vitest (unit); Playwright E2E planned                      |
| Deployment     | Vercel + Neon                                              |

## Quick start

**Requirements:** Node.js ≥ 22.12, npm ≥ 10, a [Neon](https://neon.tech) project. No local
database server is used.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then paste the Neon DATABASE_URL (pooled) and DIRECT_URL
npm run db:deploy           # apply committed migrations to the Neon database
npm run db:seed             # insert the six launch categories (idempotent)
npm run db:verify           # read-only: connections, migrations, tables (no secrets printed)
npm run dev                 # http://localhost:3000
```

Health check: `GET /api/health` returns `200 {"database":"ok"}` when the database is
reachable, and `503` with `not_configured` or `unreachable` otherwise.

Step-by-step Neon setup is in [docs/DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md#2-database-setup-neon).

## Scripts

| Script                    | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`             | Start the development server                                                 |
| `npm run build`           | Production build                                                             |
| `npm run build:cloud`     | Production build in the cloud sandbox (Neon over HTTPS)                      |
| `npm run start`           | Serve the production build                                                   |
| `npm run lint`            | ESLint (Next.js core-web-vitals + TypeScript rules)                          |
| `npm run lint:fix`        | ESLint with auto-fix                                                         |
| `npm run typecheck`       | Generate route types and run `tsc --noEmit`                                  |
| `npm run format`          | Prettier (with Tailwind class sorting)                                       |
| `npm run format:check`    | Verify formatting (CI)                                                       |
| `npm run test`            | Unit tests (Vitest)                                                          |
| `npm run validate`        | typecheck + lint + format check + tests                                      |
| `npm run db:migrate`      | Create + apply a new migration on the dev branch (`migrate dev`)             |
| `npm run db:deploy`       | Apply committed migrations only (safe for production)                        |
| `npm run db:status`       | Show which migrations are applied / pending                                  |
| `npm run db:verify`       | Read-only check of both Neon connections, migrations and tables              |
| `npm run db:drift`        | Exit 0 if the database matches `schema.prisma`, 2 if it drifts               |
| `npm run dev:cloud`       | Dev server in the Claude Code cloud sandbox (Neon over HTTPS)                |
| `npm run start:cloud`     | Production server in the cloud sandbox (Neon over HTTPS)                     |
| `npm run db:verify:cloud` | `db:verify` over HTTPS, for the cloud sandbox                                |
| `npm run admin:create`    | Create/promote the first admin from `ADMIN_EMAIL` + `ADMIN_INITIAL_PASSWORD` |
| `npm run db:seed`         | Seed reference data (launch categories)                                      |
| `npm run db:studio`       | Open Prisma Studio                                                           |
| `npm run vercel-build`    | Build command for Vercel: `migrate deploy` then `next build`                 |

## Environment variables

All variables are documented in [`.env.example`](.env.example) and validated with Zod in
`src/lib/env/`. Real values go in `.env` locally (git-ignored) and in the Vercel project
settings in production. **Never commit secrets.**

| Variable                                                               | Required    | Used for                                       |
| ---------------------------------------------------------------------- | ----------- | ---------------------------------------------- |
| `DATABASE_URL`                                                         | Yes         | Neon **pooled** connection (app runtime)       |
| `DIRECT_URL`                                                           | Yes (Neon)  | Neon **direct** connection (Prisma migrations) |
| `SHADOW_DATABASE_URL`                                                  | Optional    | Shadow DB for `migrate dev`                    |
| `AUTH_SECRET`, `AUTH_URL`                                              | Later phase | Auth.js sessions                               |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Later phase | Product/category image uploads                 |
| `RESEND_API_KEY`, `ADMIN_EMAIL`                                        | Later phase | Inquiry notification emails                    |
| `NEXT_PUBLIC_SITE_URL`                                                 | Yes in prod | Metadata, sitemap, absolute URLs               |

## Project structure

```
├── docs/                    Architecture and development documentation
├── prisma/
│   ├── schema.prisma        Database schema
│   ├── migrations/          Versioned SQL migrations (commit these)
│   └── seed.ts              Idempotent reference-data seed
├── public/brand/            Original Kishwour logo assets
├── scripts/                 CLI scripts (db-verify: read-only database check)
└── src/
    ├── app/                 Routes: (store), (auth), admin, api
    ├── components/          ui (shadcn), layout, products, forms, shared
    ├── config/              Static site/brand configuration
    ├── features/            Domain modules: products, categories, inquiries, …
    ├── generated/prisma/    Generated Prisma Client (git-ignored)
    ├── hooks/               Reusable React hooks
    ├── lib/                 Infrastructure: db, env, auth, validations, cloudinary, email, utils
    ├── test/                Test helpers
    └── types/               Shared TypeScript types
```

See [docs/PROJECT_ARCHITECTURE.md](docs/PROJECT_ARCHITECTURE.md) for the reasoning behind
this structure and the data model.

## Editing the website pages

`/admin/pages` lists every editable page — Homepage, About Us, Our Craft, Sustainability,
Wholesale and Contact — with its status and when it was last published. Each one opens a
visual editor at `/admin/pages/<page>`: the real page on the left, an edit panel on the
right. Hover a section for **Edit**, **Replace / Delete image**, **Hide / Show** and
**Move up / down**. (`/admin/homepage` still works and redirects to `/admin/pages/home`.)

- Editing writes to a **draft** (`SiteSetting` key `homepage.draft` for the homepage,
  `page.<id>.draft` for the others). The public site keeps showing the **published**
  document until you press **Publish**.
- Nothing is published until you confirm it, and **Discard draft** returns to the live content.
- When nothing has been published, the homepage falls back to the content in
  `src/content/site-content.ts`, so the site always renders.
- **Testimonials** are part of the document: add, edit, reorder and remove them in the
  Testimonials panel (max 12). Only publish real quotes from real buyers who gave their
  permission. While the list is empty the section stays hidden on the website.
- **History**: every Publish is snapshotted per page (the newest 10 are kept).
  The toolbar's **History** button lists them with the date, who published and which
  sections changed. **Restore to draft** loads a version back into the draft; it goes live
  only when you publish again.
- **Contact details** (email, phone, WhatsApp, address) stay under
  **Content → Contact details**; the Contact page editor owns only its heading and intro.
- **Search engine listing**: the five content pages have a meta title and description in
  the toolbar's **SEO** panel; empty falls back to the page heading.
- Images are uploaded to the Cloudinary folder `kishwour/site` and require
  `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. Every upload is
  recorded in one shared list (`site.uploads`); an asset is deleted only after a publish or
  discard, and only when **no** page's draft, published document or kept history version
  still references it.
- Category and product cards keep coming from the Category and Product records — manage them
  under `/admin/categories` and `/admin/products`.

Requires the `content:manage` permission (administrators and editors).

## Roadmap

1. **Foundation** — setup, design tokens, tooling ✅
2. **Database** — Neon PostgreSQL, Prisma 7, core B2B schema, initial migration applied ✅
3. **UI design system** — components and preview page ✅
4. **Public website** — home, about, our craft, sustainability, contact, wholesale, request a
   quote, SEO, sitemap ✅
5. **Product catalogue** — filters, search, sorting, variants, category pages under
   `/products/<slug>`, PDF catalogue (`/catalog.pdf`) — migration pending approval
6. **Admin dashboard** (`/admin`) — Auth.js login, role-based access, products, categories,
   inquiries, sample requests, quotations (PDF + email), customers, Alibaba links, content —
   migration and first admin account pending approval
7. **Page editors** (`/admin/pages`) — visual editors for the homepage, About Us, Our Craft,
   Sustainability, Wholesale and Contact ✅
8. Upcoming: the same editing workflow for the About, Our Craft, Sustainability, Wholesale
   and Contact pages; launch on Vercel
9. **B2C (future)** — cart, checkout, customer accounts, orders

## Brand

The original Kishwour logo lives in `public/brand/`. Use the `BrandLogo` component
(`src/components/shared/brand-logo.tsx`); do not recolour or redraw the logo.

| Token         | Hex       | Tailwind                      |
| ------------- | --------- | ----------------------------- |
| Forest Green  | `#176B43` | `bg-forest`, `primary`        |
| Natural Beige | `#E9DFC9` | `bg-beige`, `secondary`       |
| Warm White    | `#F8F6F0` | `bg-warm-white`, `background` |
| Jute Brown    | `#A66E43` | `text-jute`                   |
| Charcoal      | `#292B25` | `text-charcoal`, `foreground` |
