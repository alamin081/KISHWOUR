# Project Architecture

This document describes how the Kishwour codebase is organised and why. Read it before adding
a new feature.

## 1. Goals that shape the architecture

- **B2B first, B2C ready.** The catalog, inquiry and quotation flows serve importers and
  wholesalers today. Retail fields (`retailPrice`, `stockQuantity`) and the `CUSTOMER` role
  exist so that a cart, checkout and orders can be added later as new modules, not a rewrite.
- **Database-driven content.** Categories and products are managed from the admin dashboard.
  Nothing business-critical is hard-coded in components.
- **Server-first.** Data is read in Server Components and changed in Server Actions. Only
  interactive UI ships as Client Components.
- **Secure by default.** Secrets stay on the server, every mutation is validated with Zod on
  the server, and every admin action checks authorisation itself (not only the route).

## 2. Folder structure

```
src/
├── app/                       Next.js App Router (routing only — keep files thin)
│   ├── (store)/               Public storefront (route group, no URL segment)
│   ├── (auth)/                Sign-in and related pages            [later phase]
│   ├── admin/                 Admin dashboard (/admin/*)            [later phase]
│   ├── api/                   Route handlers (webhooks, health, uploads)
│   │   └── health/route.ts    DB connectivity check
│   ├── layout.tsx             Root layout: fonts, metadata, toaster
│   ├── error.tsx, global-error.tsx, not-found.tsx, loading.tsx
│   └── icon.png, apple-icon.png
│
├── components/
│   ├── ui/                    shadcn/ui primitives (generated, lightly customised)
│   ├── layout/                Header, footer, navigation, admin shell
│   ├── products/              Product cards, galleries, spec tables
│   ├── forms/                 Shared form building blocks (fields, form wrappers)
│   └── shared/                Cross-cutting pieces (BrandLogo, empty states, …)
│
├── features/                  Domain modules (business logic lives here)
│   ├── products/
│   ├── categories/
│   ├── inquiries/
│   ├── quotations/
│   ├── customers/
│   └── admin/
│
├── lib/                       Infrastructure, no business rules
│   ├── db/                    Prisma client singleton (`db`)
│   ├── env/                   Zod-validated environment (server.ts / client.ts)
│   ├── auth/                  Auth.js configuration and guards        [later phase]
│   ├── validations/           Shared Zod primitives (email, slug, phone, …)
│   ├── cloudinary/            Cloudinary client and upload helpers   [later phase]
│   ├── email/                 Resend client and email templates       [later phase]
│   └── utils/                 Pure helpers (`cn`, `slugify`, …)
│
├── config/                    Static configuration (site name, logo, nav)
├── hooks/                     Reusable client hooks
├── types/                     Shared TypeScript types
├── test/                      Test helpers and stubs
└── generated/prisma/          Generated Prisma Client (git-ignored, built on install)
```

### Changes from the originally proposed structure

| Proposal         | Decision                                                                       | Reason                                                                          |
| ---------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `src/services/`  | Merged into `src/features/*` (domain logic) and `src/lib/*` (external clients) | Avoids two places for the same code; each feature owns its queries and actions. |
| `src/lib/env/`   | Added                                                                          | Central, typed, validated access to environment variables.                      |
| `src/config/`    | Added                                                                          | Brand constants (name, tagline, logo) in one place.                             |
| `src/generated/` | Added                                                                          | Prisma 7 generates the client into the source tree instead of `node_modules`.   |

### Feature module convention

Each folder in `src/features/<domain>/` follows the same layout as it grows:

```
features/products/
├── schemas.ts        Zod schemas shared by the form (client) and the action (server)
├── queries.ts        Read functions ("server-only"; may use `"use cache"` + cacheTag)
├── actions.ts        Server Actions ("use server"): auth check → validate → write → revalidate
├── constants.ts      Domain constants
├── types.ts          Domain types derived from Prisma/Zod
└── components/       UI that only makes sense inside this feature
```

Rules:

1. `app/` files import from `features/` and `components/`; they hold no business logic.
2. `features/` may import from `lib/`, `components/` and other features' public files.
3. `lib/` never imports from `features/` or `app/`.
4. Any module that touches the database or secrets starts with `import "server-only"`.

## 3. Rendering and caching

The project uses **Cache Components** (`cacheComponents: true`) with **Partial Prefetching**:

- Pages are prerendered into a static shell; request-time content (session, cookies, search
  params) streams in behind `<Suspense>`.
- Catalog reads (`features/*/queries.ts`) will use `"use cache"` with `cacheTag()`; admin
  mutations call `revalidateTag()` / `updateTag()` so storefront pages refresh immediately
  after an edit.
- Route segment `runtime` exports are **not** used (Cache Components requires Node.js).
- Error boundaries use the Next.js 16.2+ `retry()` prop.

## 4. Database

### 4.1 Provider and connections

- **Neon** serverless PostgreSQL. No local, Docker or SQLite database is used.
- **Prisma ORM 7.10** with the `prisma-client` generator (output `src/generated/prisma`,
  git-ignored, regenerated on `npm install`).
- Prisma 7 has no `url`/`directUrl` in `schema.prisma`; connections are split by consumer:

| Consumer                        | Variable              | Neon endpoint               | Configured in         |
| ------------------------------- | --------------------- | --------------------------- | --------------------- |
| Next.js app (queries)           | `DATABASE_URL`        | **Pooled** (`-pooler` host) | `src/lib/db/index.ts` |
| Prisma CLI (migrate, studio)    | `DIRECT_URL`          | **Direct** (no `-pooler`)   | `prisma.config.ts`    |
| `migrate dev` shadow (optional) | `SHADOW_DATABASE_URL` | separate empty branch       | `prisma.config.ts`    |

Why two URLs: the pooled endpoint (PgBouncer, transaction mode) scales to many serverless
connections, while migrations need a session-level connection (advisory locks), so they use
the direct endpoint. `DIRECT_URL` falls back to `DATABASE_URL` for databases without a pooler.

- Runtime driver (`DATABASE_DRIVER`):
  - `pg` (default) — `@prisma/adapter-pg` over TCP + TLS. Full Prisma feature set; used on
    Vercel and anywhere raw TCP is allowed.
  - `neon-http` — `@prisma/adapter-neon` (`PrismaNeonHttp`) over HTTPS, only for HTTPS-only
    sandboxes (the Claude Code cloud environment). No transactions. Selected by `*:cloud` scripts.
- Pool settings (`src/lib/db/index.ts`): max 5 connections per instance in production,
  15 s connect timeout (Neon computes may be waking from scale-to-zero), 30 s idle timeout.

### 4.2 Database access layer (`src/lib/db/`)

| Export                   | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| `db`                     | The single shared `PrismaClient` (server-only).                       |
| `TransactionClient`      | Type of `tx` inside `db.$transaction(async (tx) => …)`.               |
| `isDatabaseConfigured()` | Whether `DATABASE_URL` is set (no network call).                      |
| `pingDatabase()`         | `SELECT 1` connectivity check (used by `/api/health`).                |
| `@/lib/db/types`         | Type-only re-exports of models and enums (safe in client components). |

Guarantees:

- `import "server-only"` makes any accidental client-side import a build error, so
  credentials can never reach the browser bundle.
- One client per process: cached on `globalThis`, so dev hot reloads do not open new pools.
- Lazy creation: importing `db` never connects or reads env vars; the first query does. Builds
  therefore succeed without database credentials.
- Only `prisma/seed.ts` (a CLI script) creates its own client, because `server-only` cannot
  be imported outside Next.js.

### 4.3 Data model

Defined in `prisma/schema.prisma`.

```
Category ─┬─ children: Category[] (optional parent → sub-categories)
          └─ Product[] ── ProductImage[]
                 │
Inquiry ─┬─ InquiryItem[] ──> Product? (SetNull; productName snapshot kept)
         └─ Quotation[] ── QuotationItem[] ──> Product? (SetNull)

User ── Account[] / Session[]       (Auth.js tables, used from the auth phase)
VerificationToken                   (Auth.js, standalone)
```

| Model           | Key fields                                                                                                                                                                                                                          | Notes                                                                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Category`      | `name`, `slug` (unique), `description`, `image`, `imagePublicId`, `parentId`, `sortOrder`, `isActive`, SEO                                                                                                                          | Self-relation for sub-categories.                                                                                                                                                               |
| `Product`       | `name`, `slug` (unique), `sku` (unique, optional), `shortDescription`, `description`, `categoryId`, `originCountry` (ISO-2, default `BD`), `material`, `minimumOrderQuantity`, `unit`, `isActive` (default **false**), `isFeatured` | B2B terms: price range, currency, incoterm, lead time, HS code, samples, customisation, `alibabaUrl`. B2C (nullable): `retailPrice`, `stockQuantity`. New products stay hidden until activated. |
| `ProductImage`  | `productId`, `imageUrl`, `publicId`, `altText`, `sortOrder`, `width`, `height`                                                                                                                                                      | Cascade-deleted with the product.                                                                                                                                                               |
| `Inquiry`       | `inquiryNumber` (unique), `companyName`, `contactPerson`, `email`, `phone`, `country` (ISO-2), `subject`, `message`, `inquiryType`, `status`, `source`                                                                              | Also `destinationPort`, `targetPrice`, `requiredBy`, internal `adminNotes`, hashed IP.                                                                                                          |
| `InquiryItem`   | `inquiryId`, `productId`, `productName`, `requestedQuantity`, `notes`                                                                                                                                                               | Unique per (inquiry, product).                                                                                                                                                                  |
| `Quotation`     | `quotationNumber` (unique), `inquiryId` (required), `currency`, `incoterm`, `subtotal`, `shippingCost`, `totalAmount`, `validityDate`, `status`, `notes`, `sentAt`                                                                  | Every quotation answers an inquiry.                                                                                                                                                             |
| `QuotationItem` | `quotationId`, `productId`, `description`, `quantity`, `unit`, `unitPrice`, `totalPrice`, `sortOrder`                                                                                                                               | `productId` null for custom OEM lines.                                                                                                                                                          |

Enums: `InquiryType` (WHOLESALE, OEM_ODM, SAMPLE_REQUEST, GENERAL), `InquiryStatus` (NEW →
IN_REVIEW → QUOTED → NEGOTIATING → WON/LOST/CLOSED, SPAM), `InquirySource` (WEBSITE, ALIBABA,
EMAIL, WHATSAPP, TRADE_SHOW, REFERRAL, OTHER), `QuotationStatus` (DRAFT, SENT, ACCEPTED,
REJECTED, EXPIRED), `Incoterm`, `Role`.

### 4.3.1 Catalogue additions (migration `catalog_filters_and_variants`)

- `Product.productType` (text, indexed) — "Product type" filter, e.g. "Tote bag".
- `Product.materials` (text[], GIN index) — normalised material tags for the "Material" filter;
  `Product.material` remains the descriptive text shown to buyers.
- `ProductVariant` — size/colour/finish variations (`name`, `sku` unique, `color`, `size`,
  `material`, `isActive`, `sortOrder`), cascade-deleted with the product. B2C price/stock can be
  added here later.

### 4.3.2 Catalogue URLs and data flow

- `/products` — all products; `/products/<slug>` — **either** a category page **or** a product
  page. Category slugs are resolved first from the cached category list, so product slugs must
  never equal a category slug (to be enforced in the admin). Legacy `/categories/<slug>` URLs
  308-redirect to `/products/<slug>` (`next.config.ts`).
- Filters are URL params (`q`, `type`, `material`, `featured`, `sort`, `page`), validated with
  Zod (`features/products/schemas.ts`) and translated to Prisma by pure, unit-tested builders
  (`features/products/catalog-query.ts`). Pagination is database-side (`skip`/`take` + `count`).
- Search matches product name, product/variant SKU, category name, material, product type and
  short description (case-insensitive).
- Facet options (types, materials with counts) come from one `groupBy` and one `unnest` query,
  cached with the catalogue tags.
- `/catalog.pdf[?category=<slug>]` — PDF catalogue rendered on the server with
  `@react-pdf/renderer` from the same queries; Cloudinary images are fetched as small JPEGs
  (allow-listed host, timeout, concurrency limit); CDN-cached for one hour.

### 4.4 Integrity rules

| Relation                              | On delete  | Effect                                                             |
| ------------------------------------- | ---------- | ------------------------------------------------------------------ |
| Category → Product                    | `Restrict` | A category with products cannot be deleted.                        |
| Category → children                   | `SetNull`  | Sub-categories become top-level.                                   |
| Product → ProductImage                | `Cascade`  | Images go with the product (delete Cloudinary assets in app code). |
| Product → InquiryItem / QuotationItem | `SetNull`  | History is kept; names/descriptions are snapshotted.               |
| Inquiry → InquiryItem                 | `Cascade`  |                                                                    |
| Inquiry → Quotation                   | `Restrict` | An inquiry with quotations cannot be deleted.                      |
| Quotation → QuotationItem             | `Cascade`  |                                                                    |

- **Money:** `Decimal(12,2)` + ISO 4217 `currency` (`CHAR(3)`). Never floats. Line and
  quotation totals are stored, so a sent quote never changes if prices change later. The
  application calculates totals; Zod enforces non-negative amounts.
- **Timestamps:** `createdAt @default(now())`, `updatedAt @updatedAt` on all mutable models.
- **Indexes** follow the expected queries: active products by category, featured products,
  inquiries by status + date / type / email / country, quotations by status + date.

### 4.5 Ready for B2C

Retail fields on `Product` and the `CUSTOMER` role already exist. A later B2C phase adds
`Cart`, `Order`, `OrderItem`, `Address` and payment tables as new models, without changing
the B2B tables.

## 4.6 Admin dashboard, authentication and authorisation

- **Auth.js v5** (`src/lib/auth/config.ts`): email + password (Credentials provider), JWT
  sessions (8 h). Passwords are hashed with scrypt (N=2^17) in `src/lib/auth/password.ts`;
  unknown emails still run a hash comparison (no timing-based account enumeration); login errors
  are generic; a per-instance throttle slows password guessing.
- **Roles** (`src/lib/auth/permissions.ts`): `ADMIN` (everything) and `EDITOR` (catalogue,
  inquiries, quotations, customers, content — not business settings or Alibaba). `CUSTOMER`
  accounts can never enter `/admin`.
- **Three layers of protection**
  1. `src/proxy.ts` — optimistic redirect to `/admin/login` without a session cookie.
  2. Every admin page calls `requireStaff(permission)`; the panel layout does too. The user is
     re-loaded from the database on every request, so deactivation/role changes apply at once.
  3. Every server action calls `assertPermission(permission)` and validates input with Zod;
     route handlers (quotation PDF) do the same and return 403.
- Admin pages are `noindex` and disallowed in `robots.txt`; `passwordHash` is never selected
  outside the login check.
- **Transactions**: multi-step writes use `withTransaction()` — a real transaction with the
  `pg` driver (production); sequential, non-atomic in the HTTPS-only sandbox.
- **Settings & content** (`SiteSetting` table, `src/features/settings`): contact details,
  social links, Alibaba store URL, brand/footer, homepage and About copy. Values are validated
  with Zod; the public site reads them through a cached function (tag `site:settings`,
  refreshed on save) and falls back to the code defaults if the table is unavailable.
- **Media**: direct browser → Cloudinary uploads signed by a server action (the API secret never
  reaches the browser); removed images are deleted from Cloudinary after the database commit.
- **Quotations**: totals computed in integer cents; PDF via `@react-pdf/renderer`; email via the
  Resend REST API with the PDF attached (only when `RESEND_API_KEY` and `EMAIL_FROM` are set).
- **Customers** are derived from inquiries grouped by email (there is no separate customer
  table); "Total customers" = distinct inquiry emails, spam excluded.
- **Alibaba**: manual links/IDs only, with the time of each manual update. No API sync.

## 5. Configuration and secrets

- `src/lib/env/server.ts` validates server variables lazily (`getServerEnv()`), so a build
  never needs secrets it does not use, but the first use of a missing variable fails loudly.
  `DATABASE_URL` and (if set) `DIRECT_URL` must be PostgreSQL URLs.
- Integrations that are not configured are reported as such by `getIntegrationStatus()`;
  features that depend on them must show a clear "not configured" state instead of pretending
  to work.
- `src/lib/env/client.ts` holds only `NEXT_PUBLIC_*` values. Database URLs are never
  `NEXT_PUBLIC_`.
- `/api/health` reports only `ok` / `not_configured` / `unreachable` — never hostnames or
  error messages.

## 6. Security baseline

- Security headers set in `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`; `X-Powered-By` removed.
- Remote images limited to `res.cloudinary.com`.
- Planned (later phases): admin route protection via Auth.js + per-action role checks, rate
  limiting and honeypot on public forms, Content Security Policy.

## 7. Deployment (Vercel + Neon)

- Recommended Neon layout: the `main` branch is **production** (Vercel Production env);
  a `development` branch (copy-on-write child of `main`) is used locally and for Preview.
- Vercel environment variables: `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) per
  environment, pointing at the matching Neon branch.
- Build command: `npm run vercel-build` → `prisma migrate deploy` (applies committed
  migrations only, never resets) then `next build`.
- `postinstall` runs `prisma generate`, so the generated client is never committed.
