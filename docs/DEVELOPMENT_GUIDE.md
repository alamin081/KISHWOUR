# Development Guide

## 1. Prerequisites

- Node.js **22.12 or newer** (`node -v`)
- npm 10+
- A [Neon](https://neon.tech) account (free tier is enough for development)
- No local PostgreSQL, Docker or SQLite is needed — all environments use Neon.

## 2. Database setup (Neon)

### 2.1 Create the Neon project

1. Sign in at <https://console.neon.tech> → **New project**.
2. Name: `kishwour`. PostgreSQL version: latest offered (16+). Region: closest to your Vercel
   region (e.g. `AWS Europe (Frankfurt)` for EU buyers, `AWS US East` for US).
3. Neon creates a `main` branch, a database (default `neondb`) and an owner role.
4. Recommended: create a `development` branch from `main` (**Branches → New branch**). Use
   `development` on your machine and for Vercel Preview; keep `main` for Production only.

### 2.2 Copy the two connection strings

In the Neon Console click **Connect**, select the branch, database and role, then:

| `.env` variable | Neon setting               | Host looks like                                |
| --------------- | -------------------------- | ---------------------------------------------- |
| `DATABASE_URL`  | **Connection pooling ON**  | `ep-<name>-<id>-pooler.<region>.aws.neon.tech` |
| `DIRECT_URL`    | **Connection pooling OFF** | `ep-<name>-<id>.<region>.aws.neon.tech`        |

Both must end with `?sslmode=verify-full`. Paste them into `.env` (git-ignored):

```env
DATABASE_URL="postgresql://<role>:<password>@<pooled-host>/<db>?sslmode=verify-full"
DIRECT_URL="postgresql://<role>:<password>@<direct-host>/<db>?sslmode=verify-full"
```

> 🔒 Never paste connection strings into code, docs, issues, chat or screenshots. If one is
> exposed, reset the role password in Neon (**Roles → Reset password**) and update `.env` and
> Vercel.

### 2.3 Apply migrations, seed and verify

```bash
npm install
npm run db:status    # shows applied / pending migrations (read-only)
npm run db:deploy    # applies committed migrations (never resets or drops data)
npm run db:seed      # inserts the six launch categories; skips any that already exist
npm run db:verify    # read-only: checks both connections, migrations and tables
npm run db:drift     # read-only: confirms the database matches schema.prisma (exit 0)
npm run dev
```

Open <http://localhost:3000/api/health> — it must return `"database":"ok"`.

### 2.4 Migration history

The repository has a single baseline migration, `prisma/migrations/20261112122551_init`,
generated from the complete schema. It replaced an earlier development-only `init` that had
only ever been applied to a throw-away local database (approved; no permanent database or data
was affected). Every later schema change is a new migration on top of this baseline.

### 2.5 Working in the Claude Code cloud sandbox (HTTPS-only network)

The cloud sandbox reaches the internet only through an HTTPS proxy, which does **not**
support raw-TCP database connections (PostgreSQL port 5432). Effects and workarounds:

| Task                        | Normal environment / Vercel | Cloud sandbox                         |
| --------------------------- | --------------------------- | ------------------------------------- |
| Production build            | `npm run build` (reads DB)  | `npm run build:cloud`                 |
| Run the app                 | `npm run dev` (pg over TCP) | `npm run dev:cloud` (Neon over HTTPS) |
| Verify the database         | `npm run db:verify`         | `npm run db:verify:cloud`             |
| `prisma migrate` / `studio` | Works                       | **Does not work** (TCP) — see below   |

- `*:cloud` scripts set `DATABASE_DRIVER=neon-http` (Prisma's official `@prisma/adapter-neon`,
  HTTP mode) and `NODE_USE_ENV_PROXY=1` so Node's `fetch` uses the sandbox proxy.
- **HTTP mode has no transactions:** `db.$transaction(...)` and nested writes that Prisma wraps
  in a transaction fail in the sandbox but work in production (`pg`). Test such code paths on a
  Vercel preview.
- Required allowed hosts in the sandbox environment: both Neon endpoint hosts and the regional
  SQL API host (`api.<region-cell>.aws.neon.tech`).
- **Migrations from the sandbox:** use Vercel (`vercel-build` runs `prisma migrate deploy`).
  The initial migration was applied once over Neon's HTTPS SQL endpoint in a single transaction,
  with its `_prisma_migrations` record (checksum) written exactly as `migrate deploy` would, and
  the resulting catalog was verified against the migration file. Do not repeat this for later
  migrations without review.

## 3. Daily workflow

```bash
npm run dev          # develop
npm run validate     # before every commit: typecheck + lint + format check + tests
npm run build        # before every merge: full production build
```

## 4. Database changes (migration workflow)

1. Edit `prisma/schema.prisma`.
2. Make sure `.env` points at the **development** branch, not production.
3. `npm run db:migrate -- --name short_description` creates a SQL file in
   `prisma/migrations/` and applies it to the development branch. `migrate dev` needs a
   shadow database; Neon's owner role can create one automatically. If it cannot, create an
   empty Neon branch and set `SHADOW_DATABASE_URL` to its direct URL.
4. **Read the generated SQL.** Prisma writes a column rename as `DROP COLUMN` + `ADD COLUMN`,
   which deletes data. Edit it to `ALTER TABLE … RENAME COLUMN …` before applying it anywhere
   that has data (use `npm run db:migrate -- --create-only` to generate without applying).
5. Commit `schema.prisma` and the new migration folder together.
6. Production: Vercel runs `npm run vercel-build` → `prisma migrate deploy`, which only
   applies committed migrations.

Regenerate types after schema changes: `npm run db:generate` (also runs on `npm install`).

### Safe database management

| ✅ Safe                                                                     | ⛔ Destructive — needs explicit approval and a backup |
| --------------------------------------------------------------------------- | ----------------------------------------------------- |
| `db:status`, `db:verify`, `db:drift`, `db:deploy`, `db:generate`, `db:seed` | `prisma migrate reset`                                |
| `db:migrate` on the **development** branch                                  | `prisma db push --force-reset` / `--accept-data-loss` |
| `db:studio` for reading                                                     | Deleting or editing files in `prisma/migrations/`     |
| Neon branch for experiments (delete the branch after)                       | `DROP` / `TRUNCATE` / bulk `DELETE` in the SQL editor |

- Before a risky production migration, create a Neon branch of `main` as an instant backup
  (Neon also keeps point-in-time restore history; retention depends on the plan).
- Never point `.env` at the production branch for day-to-day development.
- `prisma db push` is not used in this project; every change goes through a migration.

### Using the client

Import the client only through `@/lib/db`, and only in server code:

```ts
import { db } from "@/lib/db";

const categories = await db.category.findMany({
  where: { isActive: true },
  orderBy: { sortOrder: "asc" },
});
```

For model types in client components, use type-only imports:
`import type { Product } from "@/lib/db/types";`.

### Development vs production databases

| Concern       | Development                        | Production                           |
| ------------- | ---------------------------------- | ------------------------------------ |
| Neon branch   | `development`                      | `main`                               |
| Migrations    | `db:migrate` (create + apply)      | `db:deploy` via `vercel-build` only  |
| Data          | Test data you create yourself      | Real buyer data — never edit by hand |
| Scale to zero | Fine (first request may take ~1 s) | Consider a minimum compute size      |

## 5. Environment variables

- Add new variables to **three** places: `.env.example` (documented, no real value), the Zod
  schema in `src/lib/env/server.ts` or `client.ts`, and the Vercel project settings.
- Read server variables with `getServerEnv()`, never `process.env` directly in app code.
- Browser-visible variables must start with `NEXT_PUBLIC_` and contain nothing secret.

## 6. UI components

- Design tokens live in `src/app/globals.css`. Use semantic classes (`bg-primary`,
  `text-muted-foreground`) for UI and brand classes (`bg-forest`, `text-jute`) for brand
  accents.
- Jute Brown (`text-jute`) has 3.9:1 contrast on Warm White: use it for large text and icons
  only; use `text-jute-deep` for small text.
- Headings use the display serif automatically (`h1`–`h4`); body text uses the sans font.
- Use `container-page` for the standard page width and padding.
- Icons: `import { Leaf } from "lucide-react"`.

### Adding shadcn/ui components

```bash
npx shadcn@latest add dialog
```

Components are written to `src/components/ui/` (see `components.json`). They are source code:
adjust them to the brand when needed. The initial components (button, input, label, textarea,
card, badge, separator, skeleton, sonner) were added from the official shadcn/ui
`new-york-v4` registry source.

## 7. Code conventions

- TypeScript strict mode with `noUncheckedIndexedAccess`: handle `undefined` from array and
  record indexing.
- Type-only imports use `import { type X }` / `import type` (enforced by ESLint).
- Prettier formats code and sorts Tailwind classes; run `npm run format`.
- File names: `kebab-case.tsx`; React components: `PascalCase`.
- Server-only modules start with `import "server-only"`.
- Server Actions: authenticate → authorise → validate with Zod → mutate → revalidate → return
  a typed result (`{ ok: true, data } | { ok: false, error, fieldErrors? }`). Never trust
  client-side validation alone.
- Every async UI has loading, empty and error states.

## 8. Testing

- Unit tests: Vitest, files named `*.test.ts(x)` next to the code. `npm run test`.
- `server-only` is stubbed in tests via `vitest.config.mts`.
- End-to-end tests (Playwright) are added in a later phase.

## 9. Next.js 16 notes

This project uses Next.js 16.4 with Cache Components. Some APIs differ from older Next.js
versions; the bundled docs in `node_modules/next/dist/docs/` match the installed version.

- Route types are global: `PageProps<"/products/[slug]">`, `LayoutProps<"/">`.
- Request-time reads (`cookies()`, `headers()`, `searchParams`) must sit inside `<Suspense>`.
- Use `await connection()` before non-deterministic work in route handlers/components.
- Do not export `runtime` from routes.
- `middleware.ts` is now `proxy.ts`.

## 10. Troubleshooting

| Problem                                                | Fix                                                                                                                                                                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Invalid server environment variables`                 | Check `.env` against `.env.example`.                                                                                                                                                                  |
| `Cannot find module '@/generated/prisma/…'`            | Run `npm run db:generate`.                                                                                                                                                                            |
| `P1001: Can't reach database server`                   | Check the Neon URLs in `.env` and that the branch/compute exists.                                                                                                                                     |
| `permission denied to create database`                 | Set `SHADOW_DATABASE_URL` to an empty Neon branch (see §4).                                                                                                                                           |
| `/api/health` returns 503 `not_configured`             | `DATABASE_URL` is empty — see §2.2.                                                                                                                                                                   |
| `/api/health` returns 503 `unreachable`                | The app cannot reach the database; see server logs.                                                                                                                                                   |
| `SECURITY WARNING: The SSL modes 'prefer', 'require'…` | node-postgres still treats `require` as full verification today, but will adopt weaker libpq semantics in pg v9. Use `?sslmode=verify-full` in `DATABASE_URL` and `DIRECT_URL` and the warning stops. |

## 11. Editing website content

- All page copy, photos, testimonials, artisan stories and verified sustainability claims live in
  `src/content/site-content.ts`. Empty lists hide their sections; `undefined` photos show a
  labelled placeholder. Never add unverified claims or invented testimonials.
- Business contact details, Alibaba store URL, social links and feature switches live in
  `src/config/site.ts` (`siteConfig`). Anything left `undefined` is hidden on the site.
- Static pages are prerendered with catalogue data (cached for 1 hour), so `next build` needs
  database access — on Vercel this is automatic; in the cloud sandbox use `npm run build:cloud`.

## 12. Admin access

1. Apply all migrations (`npm run db:deploy`).
2. Set `AUTH_SECRET` (e.g. `openssl rand -base64 33`), `ADMIN_EMAIL` and a temporary
   `ADMIN_INITIAL_PASSWORD` (≥ 12 characters, letters and a number) in the environment.
3. Run `npm run admin:create` (cloud sandbox: `npm run admin:create:cloud`). The password is
   never printed. Remove `ADMIN_INITIAL_PASSWORD` afterwards.
4. Sign in at `/admin/login`.

Optional integrations (features show a "not configured" message until set):

| Feature         | Variables                                                              |
| --------------- | ---------------------------------------------------------------------- |
| Image uploads   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Quotation email | `RESEND_API_KEY`, `EMAIL_FROM` (sender on a Resend-verified domain)    |
