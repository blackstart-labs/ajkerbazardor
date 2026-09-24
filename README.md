# আজকের বাজারদর

Dhaka's daily retail prices, sourced from TCB (Trading Corporation of Bangladesh). Not an official TCB site.

---

## What this is

A public price-tracking website that shows how much essential goods cost in five Dhaka markets each day. Data comes in as a daily TCB `.xlsx` bulletin; an admin uploads it and the backend parses, validates and publishes automatically. The public site looks like a grocery storefront — same familiar layout, but nothing is for sale.

Five markets tracked: Mirpur-6, Mohammadpur Town Hall, New Market, Rampura, Mohakhali.

---

## Architecture

```
apps/
  web/      Nuxt 3 (SSR + route caching)        public site
  admin/    Vue 3 + Vite SPA                    private upload/edit panel
  api/      NestJS + Drizzle ORM + Turso        REST API
packages/
  shared/   zod schemas, price math, formatters, name normaliser, copy.bn.ts
  ui/       design tokens + Vue primitives + chart wrappers
reference/  source TCB xlsx files (not committed, gitignored)
```

**Database:** [Turso](https://turso.tech) (libSQL / SQLite). Local dev uses a file-based SQLite. Tests use a temporary file per worker.

> **Future option (not yet implemented):** Turso embedded replicas for the API server would eliminate network round-trips on every request. See [Turso embedded replicas docs](https://docs.turso.tech/sdk/ts/guides/local-development) when query latency becomes a concern.

---

## Prerequisites

- Node 22 (`nvm install 22 && nvm use 22`)
- pnpm 10+ (`npm install -g pnpm`)
- A Turso account (free tier is sufficient — see storage analysis below)

---

## Setup

```bash
# 1. Clone and enter
git clone https://github.com/blackstart-labs/ajkerbazardor.git
cd ajkerbazardor

# 2. Use correct Node version
nvm use   # reads .nvmrc → 22

# 3. Install all workspace dependencies
pnpm install

# 4. Copy and fill in environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — at minimum set TURSO_DATABASE_URL, TURSO_AUTH_TOKEN,
# JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD

# 5. Run migrations
pnpm migrate

# 6. Start everything
pnpm dev
```

### Environment variables

All required vars are documented in [`apps/api/.env.example`](apps/api/.env.example).
Required at boot — the API refuses to start if any are missing.

| Variable                                                        | Description                                                |
| --------------------------------------------------------------- | ---------------------------------------------------------- |
| `TURSO_DATABASE_URL`                                            | `libsql://…turso.io` for remote, `file:./dev.db` for local |
| `TURSO_AUTH_TOKEN`                                              | Turso auth token (empty string for local file)             |
| `JWT_SECRET`                                                    | ≥32-character random string                                |
| `ADMIN_EMAIL`                                                   | Seeded admin account email                                 |
| `ADMIN_PASSWORD`                                                | Seeded admin account password                              |
| `STORAGE_DRIVER`                                                | `local` (dev) or `s3` (production)                         |
| `S3_BUCKET` / `S3_ENDPOINT` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Required when `STORAGE_DRIVER=s3`                          |
| `CORS_ORIGIN`                                                   | Comma-separated allowed origins                            |

---

## Development

```bash
pnpm dev          # start all apps in parallel (API + web + admin)
pnpm test         # run all tests
pnpm lint         # ESLint across the monorepo
pnpm typecheck    # tsc --noEmit on all packages
pnpm format       # Prettier write
pnpm migrate      # apply pending DB migrations
```

### Running a single package

```bash
pnpm --filter api dev
pnpm --filter shared test:coverage
pnpm --filter web dev
```

---

## Database migrations

Migrations are plain SQL files in `apps/api/drizzle/migrations/`, committed to the repo.

```bash
# Apply pending migrations (local or against TURSO_DATABASE_URL)
pnpm migrate

# Generate a new migration after changing the schema
pnpm --filter api exec drizzle-kit generate
```

CI runs migrations against a temporary local SQLite file to verify they apply cleanly.

---

## Backups and recovery

Turso's free plan includes point-in-time recovery via their dashboard.

For a manual export:

```bash
# Dump the entire database as SQL
turso db shell <your-db-name> ".dump" > backup-$(date +%Y%m%d).sql

# Or run the included export script
pnpm --filter api exec ts-node scripts/export.ts --out backup.sql
```

Store the SQL dump somewhere outside Turso (e.g. an S3 bucket or git-ignored local file).

**Storage analysis:** ~60 products × 365 days = ~22,000 `PriceEntry` rows/year. Raw BLOB storage for uploaded files: ~50 KB/day × 365 = ~18 MB/year. Both are well within the 5 GB free tier.

---

## Deployment

The project is hosting-agnostic. Dockerfiles are in each app directory.

| App     | Container               | Notes                                     |
| ------- | ----------------------- | ----------------------------------------- |
| `api`   | `apps/api/Dockerfile`   | Node 22, listens on `PORT` (default 3000) |
| `web`   | `apps/web/Dockerfile`   | Nuxt 3 Node server, SSR                   |
| `admin` | `apps/admin/Dockerfile` | Static build, serve with nginx or any CDN |

**Database in production:** a separate Turso database per environment (staging, production). Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` from your Turso dashboard.

---

## Source and disclaimer

Price data comes from the daily TCB retail market bulletin. This is an independent project and is not affiliated with or endorsed by TCB or any government body. See [`/about`](https://ajkerbazardor.example.com/about) for methodology.
