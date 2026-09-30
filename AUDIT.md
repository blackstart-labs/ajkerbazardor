# Ajker Bazar Dor — Phase 1 Audit

Audit date: 2026-09-30  
Repo commit audited: `7202644b5d8052249b6f940e72d07547a1a34fce`

## Scope and limitations

- Read all committed project documentation found by scan: root `README.md`; no `ARCHITECTURE.md`, `/docs`, ADRs, or committed build-spec prompts were found.
- Read package manifests, env examples, CI workflows, Drizzle schema/migrations, API controllers/services, web pages/stores, admin views/stores, shared copy/math/normalisation tests, and UI tokens/components/tests.
- Reference TCB files are present: `reference/tcb-2026-09-22.xlsx`, `tcb-2026-09-23.xlsx`, `tcb-2026-09-24.xlsx`, `tcb-2026-09-25.xlsx`.
- I could not run the normal CI commands because this environment has Node `v12.22.9` and no `pnpm`, while the repo requires Node 22 and pnpm 10+/12.6.0. Therefore lint/typecheck/test/build status is **not verified locally**.
- I could not pull actual Vercel function logs or environment variables because the repo has no committed Vercel config/project metadata and the Vercel CLI is not installed/authenticated here. I did perform public HTTP checks against the configured production API URL.
- Local ignored files/build artifacts exist in the workspace (`apps/*/.env`, `apps/api/dist`, `apps/admin/dist`, `apps/web/.nuxt`, `apps/web/.output`, `apps/web/--port`), but `git ls-files` shows only `.env.example` files are tracked.

## Production API instability

### What I could verify

Configured production API base in web/admin env examples and clients:

- `https://api-tawny-pi-32.vercel.app/api/v1`

Public requests currently fail:

| Request                                                          | Observed result                                     |
| ---------------------------------------------------------------- | --------------------------------------------------- |
| `GET https://api-tawny-pi-32.vercel.app/health`                  | `500`, `x-vercel-error: FUNCTION_INVOCATION_FAILED` |
| `GET https://api-tawny-pi-32.vercel.app/api/v1/health`           | `500`                                               |
| `GET https://api-tawny-pi-32.vercel.app/api/v1/products?limit=1` | `500`                                               |

Captured response body for `/health`:

```text
A server error has occurred

FUNCTION_INVOCATION_FAILED

bom1::5s27m-1790704998016-fdf8fb56539a
```

### Root-cause hypothesis with evidence

Most likely root cause: **the API deployment strategy is inconsistent/stale for Vercel serverless**, and production is invoking a function that fails before Nest can serve even `/health`.

Evidence:

1. The current source tree has **no `vercel.json`** and no root/app Vercel config to define the serverless entrypoint, rewrites, build output, or included files.
2. The README says Dockerfiles exist for all apps, but no Dockerfiles are present in the committed source tree.
3. `apps/api/package.json` is a normal long-running Nest/Fastify app: `start: node dist/main.js`. `apps/api/src/main.ts` calls `app.listen(...)`, which is not itself a Vercel request handler.
4. A serverless handler exists only in ignored/local build output: `apps/api/dist/serverless.js`. There is **no matching `apps/api/src/serverless.ts`** or `src/setup.ts`; source-controlled builds cannot reliably regenerate this handler.
5. `/health` fails with Vercel `FUNCTION_INVOCATION_FAILED`, not an application-shaped JSON error. That points to a function bootstrap/runtime failure, not a route-specific database/read error.

Still unverified until external access is provided:

- Actual Vercel function stack trace.
- Vercel production env vars: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CORS_ORIGIN`, `NODE_ENV`.
- Whether Vercel deployed the latest Git commit.
- Whether the deployed function includes `dist/` and all dependencies expected by the ad-hoc serverless handler.
- Whether the exact Turso URL/token configured in Vercel can reach the DB.

## Feature-by-feature status

Legend: **Done** = implemented and broadly matches spec/docs; **Partial** = implemented but incomplete or unverified; **Missing** = absent; **Diverged** = implementation conflicts with docs/spec or app/client contracts.

### Public storefront

| Area                         | Status  | Evidence / notes                                                                                                                                                                                 |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home/storefront              | Partial | `apps/web/pages/index.vue` renders hero, summary, movers, categories, sort, infinite product grid. It depends on production API, currently 500.                                                  |
| Listing with filters         | Partial | API supports category/search/sort/direction/min/max/page/date in `ProductsReadController`; UI exposes search, category, sort only. No explicit price/direction filter UI or mobile drawer/sheet. |
| Product page                 | Partial | `apps/web/pages/panna/[slug].vue` renders PDP with context cards and history chart. No JSON-LD/canonical/OG per product.                                                                         |
| Watchlist                    | Missing | Copy exists in `packages/shared/src/copy.bn.ts`, but no route/store/component persisted watchlist behavior found.                                                                                |
| List estimator / market list | Missing | Copy exists (`listTitle`, `listEstimate`), but no implemented UI or calculation flow found.                                                                                                      |
| About page                   | Missing | README references `/about`; no `apps/web/pages/about.vue` exists.                                                                                                                                |
| Share                        | Missing | `IconShare` exists in UI package, but no share action/component in web pages.                                                                                                                    |
| Loading/empty/error states   | Partial | Home and PDP have some skeleton/empty/error states. API-failure and sparse-data behavior not verified live due production 500.                                                                   |

### Public dashboard / charts

| Area                 | Status         | Evidence / notes                                                                                                                |
| -------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard summary    | Partial        | API has `/dashboard/summary`; home consumes summary counts/movers, but there is no separate public dashboard route.             |
| Movers chart         | Partial        | API and UI chart wrapper exist; web home renders simple lists, not `MoversChart`.                                               |
| Bazar Index chart    | Partial        | API `/dashboard/index` and `BazarIndexChart` exist; no public page renders it. Store has `fetchIndex` but home does not use it. |
| Heatmap              | Missing in UI  | API `/dashboard/heatmap` exists; no matching web page/component usage found.                                                    |
| Distribution chart   | Missing in web | `DistributionChart` exists/tests pass conceptually, but not wired in web.                                                       |
| Real vs fixture data | Partial        | API reads DB data; public web points to production API, currently 500. No fixture fallback found.                               |

### Admin

| Area                                   | Status           | Evidence / notes                                                                                                                                                                                                                                                                                      |
| -------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                                   | Partial          | Login/refresh/logout/me exist. Admin SPA stores access token in `localStorage` and uses httpOnly refresh cookie. No automatic refresh wrapper is actually applied to API calls.                                                                                                                       |
| Roles                                  | Partial          | API has `admin`/`editor` roles and guards, but most admin write endpoints allow both roles; no role-specific UI behavior found.                                                                                                                                                                       |
| Categories CRUD                        | Partial          | API supports list/create/update/delete/reorder; admin UI has no category management screen.                                                                                                                                                                                                           |
| Products CRUD                          | Partial          | API supports create/update/archive/unarchive/delete/approve. Admin UI lists products and edit page updates only `nameBn`, unsupported `nameEn`, `sortOrder`, and archive state; no create UI and no category/unit edit controls. Product list expects price fields not returned by admin product API. |
| Automatic xlsx import                  | Partial          | API parses/imports `.xlsx`, admin upload screen calls `/admin/imports`. Reference parser/import tests exist for 2026-09-22/23 only.                                                                                                                                                                   |
| Undo                                   | Partial          | API can undo to previous revision. UI has undo button. First import cannot be undone and endpoint returns 400 if no previous revision; UI does not explain this.                                                                                                                                      |
| Idempotency by hash                    | Missing          | `revision.sha256` is stored and indexed, but `ImportService` never checks existing hash before creating a new revision. Re-uploading same file is **not** a no-op.                                                                                                                                    |
| Review queue for auto-created products | Partial          | API has `/admin/review-queue` and approve endpoint; no admin view/route exposes review queue. Imported new products set `needsReview: true`.                                                                                                                                                          |
| Audit log                              | Partial/Diverged | API stores audit logs and exposes `/admin/audit`; UI expects fields `entityType`, `createdAt`, `performedBy`, but API returns `entity`, `at`, `userEmail`, `diff`. Audit UI likely renders blanks/invalid dates.                                                                                      |
| Reports                                | Partial          | Admin reports view is marked stub and just maps imports; no true report list/detail/revision history.                                                                                                                                                                                                 |

### Importer parsing correctness

| Area                                   | Status   | Evidence / notes                                                                                                                                                                                                                                               |
| -------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference files present                | Done     | Four files in `reference/`.                                                                                                                                                                                                                                    |
| 60 distinct products                   | Partial  | Existing Jest tests assert 60 products for 2026-09-22 and 2026-09-23. A read-only Python sheet pass using parser-like row boundaries counted 60 product rows in all four files. Distinctness after import not verified by executable tests here due toolchain. |
| Repeated “prices changed” rows skipped | Partial  | Parser stops product parsing at market/source block before changed-items block. Existing tests do not explicitly assert changed rows are skipped.                                                                                                              |
| `0` / bad formula values become null   | Partial  | Parser maps numeric `0`, falsy cells, and unparsable strings to `null`; tests do not explicitly cover `#DIV/0!`.                                                                                                                                               |
| Soybean oil sizes stay distinct        | Partial  | Shared `productKey` test distinguishes 1/2/5 litre units. Import uniqueness uses `(nameKey, unitId)`, so distinct units should stay distinct. Not covered in import test assertions.                                                                           |
| Re-upload no-op by hash                | Missing  | No hash guard before import; duplicate file creates another revision.                                                                                                                                                                                          |
| Undo restores exact prior state        | Partial  | Existing test asserts current revision pointer reverts, not full exact state equality.                                                                                                                                                                         |
| Transactionality                       | Diverged | Test name says “atomically”, but `ImportService` does not use a DB transaction; partial writes are possible if an insert fails mid-import.                                                                                                                     |

### Turso / Drizzle / data model

| Area                         | Status            | Evidence / notes                                                                                                                                                                     |
| ---------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema/migrations            | Partial           | Drizzle schema and migrations mostly align. Migration creates `product_category_override`, but it is not represented in `schema.ts`.                                                 |
| `current_prices` view        | Done in migration | `0001_initial.sql` creates `current_prices`. It is not represented in Drizzle schema and read services do not use it directly.                                                       |
| Deltas computed at read time | Done              | `mid`, `changePct`, `direction` are computed in read services/shared math.                                                                                                           |
| Foreign keys enforced        | Partial           | Migration sets `PRAGMA foreign_keys = ON`; `DrizzleModule` also enables it asynchronously. Because the async call is not awaited before returning DB, there is a small startup race. |
| Local file DB path for tests | Done              | Tests create file DBs; CI env uses `file:./ci-test.db`.                                                                                                                              |
| Migrations in CI             | Partial           | CI has a migrations job, but local verification blocked by missing Node/pnpm.                                                                                                        |

### Design system / accessibility

| Area                    | Status   | Evidence / notes                                                                                                                                                          |
| ----------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens                  | Done     | `packages/ui/src/tokens/tokens.css` defines warm storefront palette, typography, spacing, dark theme, reduced-motion override.                                            |
| Dark mode               | Partial  | Tokens support `[data-theme='dark']`/`.dark`, icons exist, but no app-level theme toggle/persistence found.                                                               |
| Motion / reduced motion | Partial  | Global token CSS suppresses animation/transition durations. Individual skeleton animations rely on CSS and should be suppressed by imported token CSS. Not verified live. |
| Bangla copy file        | Diverged | `copy.bn.ts` exists and says “Never inline in templates”, but web/admin templates contain extensive inline Bangla copy.                                                   |
| `lang="bn"`             | Partial  | Nuxt sets `htmlAttrs: { lang: 'bn' }`. Admin SPA `index.html` not audited for lang in detail; likely absent unless static template sets it.                               |
| Focus states            | Partial  | Many inputs/buttons have focus states; not comprehensive.                                                                                                                 |
| Alt text                | Partial  | Product images use product names as alt. Emoji logo/decorative blobs handled with aria-hidden in places.                                                                  |
| Error color semantics   | Diverged | Several error alerts use `--color-trend-up-*`, which is semantically price-rise red but may be okay visually; success uses trend-down green.                              |

### SEO

| Area          | Status          | Evidence / notes                                                                                |
| ------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| SSR           | Partial         | Nuxt SSR enabled. Runtime data SSR depends on API, currently production 500.                    |
| Meta per page | Partial         | Home and PDP set title/description. No canonical/OG product-specific metadata beyond global OG. |
| Sitemap       | Missing         | No sitemap route/module/config found.                                                           |
| Robots        | Missing         | No `robots.txt` or Nuxt robots config found.                                                    |
| JSON-LD       | Missing         | No structured data found.                                                                       |
| OG images     | Missing/Partial | Global OG title/description/type only; no image config found.                                   |

### Security

| Area               | Status           | Evidence / notes                                                                                                                                                                                                                                                                      |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate limiting      | Partial/Diverged | `@nestjs/throttler` imported and login has `@Throttle`. Upload has no stricter throttle decorator despite env vars. No `ThrottlerGuard` is registered globally, so throttling may not actually run.                                                                                   |
| CORS allow-list    | Diverged         | `main.ts` and built `setup.js` allow any `*.vercel.app` origin. That is not an exact allow-list and is risky with credentialed requests.                                                                                                                                              |
| Password hashing   | Done             | Uses `bcryptjs`. Schema comment still says argon2 hash, stale.                                                                                                                                                                                                                        |
| JWT / refresh flow | Partial          | Access token + refresh cookie implemented. No refresh-token revocation/rotation persistence; admin client doesn't wrap ordinary API calls with `apiWithRefresh`. Cookie `sameSite: lax` may not work cross-site if admin and API are on different sites needing credentialed refresh. |
| Input validation   | Partial          | Login uses Zod. Many admin write endpoints accept TypeScript interfaces directly with no runtime schema validation. ParseIntPipe used for IDs.                                                                                                                                        |
| Secrets committed  | Done             | `git ls-files` shows only env examples, not real `.env`. Local ignored `.env` files exist.                                                                                                                                                                                            |
| Dependency audit   | Unknown          | Could not run `pnpm audit` because pnpm unavailable.                                                                                                                                                                                                                                  |
| Admin write guards | Partial          | Most admin write endpoints use `JwtAuthGuard`/`RolesGuard`; categories write endpoints guarded individually. Need verify `RolesGuard` behavior at runtime once tests can run.                                                                                                         |

### Tests and CI

| Area         | Status                         | Evidence / notes                                                                                                                                                                  |
| ------------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API tests    | Partial                        | Tests cover auth service, catalogue, import for two xlsx files, read APIs, schema. Some claims are not fully tested (idempotency, transactions, exact undo, all four references). |
| Shared tests | Partial                        | Math and normalisation tests exist.                                                                                                                                               |
| UI tests     | Partial                        | Vitest tests for primitives/domain/charts/tokens exist.                                                                                                                           |
| Web tests    | Missing                        | `apps/web/package.json` test scripts print “No tests yet for web”.                                                                                                                |
| Admin tests  | Missing                        | `apps/admin/package.json` test scripts print “No tests yet for admin”.                                                                                                            |
| CI green     | Unknown/likely blocked locally | Could not run due local Node 12/no pnpm. CI workflow exists but may fail if real repo lock/packageManager mismatch matters (`packageManager: pnpm@12.6.0`, README says pnpm 10+). |

## Conflicts / decisions needed

1. **Hosting strategy conflict:** README says app is hosting-agnostic with Dockerfiles, but Dockerfiles are absent; production is on Vercel, and source-controlled API is a long-running Nest server rather than a reliable Vercel handler. Decide whether to move API to an always-on Node host or formalize a Vercel serverless handler in source.
2. **CORS policy conflict:** Spec asks exact allow-list; code allows any `*.vercel.app`. Decide if preview deploys should be allowed and by what safer mechanism.
3. **Copy convention conflict:** `copy.bn.ts` says never inline copy, but most templates inline Bangla copy. Decide whether to enforce central copy now or relax/update the convention.
4. **Current behavior vs spec:** Admin product screens are lightweight/stub-like and do not expose full CRUD/review workflows. Decide whether full admin completion remains in scope for Phase 3.
5. **Dashboard shape:** APIs and UI chart wrappers exist, but no public dashboard route renders the specified charts. Decide whether dashboard is a separate page, a home section, or deferred.
6. **Import idempotency:** Schema stores hashes but current behavior creates new revisions on re-upload. Decide desired duplicate behavior: hard no-op response, return existing revision, or allow intentional duplicate revision.

## Prioritized Phase 2 punch list

### Blocking

1. **Stabilize production API.** Get Vercel logs/env/deployed commit; either source-control a correct serverless handler/config or move API to an always-on Node host. Confirm `/health`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, and `/api/v1/products` in production.
2. **Make deploy/build source-controlled.** Add missing deploy config and/or Dockerfiles, remove dependency on ignored local `dist` serverless files, and document actual deploy commands.
3. **Fix CI/toolchain reproducibility.** Ensure Node 22 + pnpm version works; run and fix `format:check`, `lint`, `typecheck`, `test`, `build`, migrations.
4. **Fix CORS for credentialed admin requests.** Replace wildcard `*.vercel.app` with an explicit safe allow-list or a reviewed preview-origin policy.
5. **Register/verify rate limiting.** Ensure login and import throttles actually run, with stricter upload throttle.
6. **Add runtime validation to admin writes.** Product/category/review/import metadata endpoints need server-side schemas, not TypeScript-only DTOs.
7. **Fix importer idempotency and transactionality.** Hash duplicate uploads should no-op; imports should be wrapped in a DB transaction or compensating rollback.

### Missing features

1. Public about page.
2. Watchlist.
3. List estimator / market list.
4. Share actions.
5. Public dashboard route/sections wiring real chart components: Bazar Index, movers, distribution, heatmap/context as specified.
6. Admin category management UI.
7. Admin product create/full edit UI including category/unit/image/aliases/review status.
8. Admin review queue UI.
9. Real reports/revisions view rather than imports stub.
10. Sitemap, robots, canonical tags, product OG metadata/images, JSON-LD.
11. Web and admin automated tests.

### Improvements

1. Align API/admin contracts: audit fields, import stats/warnings JSON parsing, admin product list price fields.
2. Centralize Bangla copy or update convention.
3. Add dark-mode toggle/persistence if dark mode is intended to be user-facing.
4. Add explicit sparse-data chart states and tests.
5. Improve admin token refresh by applying `apiWithRefresh` or an interceptor.
6. Add tests for all four reference xlsx files, `#DIV/0!`, duplicate upload, exact undo, soybean bottle sizes in import DB.
7. Represent `product_category_override` and `current_prices` in Drizzle or document why raw SQL is used.
8. Await or otherwise guarantee `PRAGMA foreign_keys = ON` before DB use.
9. Remove stale schema comments (`argon2`) and README claims that no longer match reality.

### Nice-to-have

1. Error tracking (Sentry or equivalent) after production hosting is stable.
2. Uptime monitoring beyond platform logs.
3. Lighthouse-driven performance pass, especially chart lazy loading and mobile filters.
4. Turso backup/restore drill documentation tied to current plan.
5. Product image management/storage pipeline instead of name-based static image heuristics.

## Checkpoint A

Phase 1 audit is complete. No application code was changed. Awaiting priority confirmation and decisions before Phase 2 implementation.

---

# Closing implementation report

Updated: 2026-09-30

## Completed in this pass

- Added source-controlled API Vercel serverless entrypoint:
  - `apps/api/src/setup.ts`
  - `apps/api/src/serverless.ts`
  - `apps/api/api/index.js`
  - `apps/api/vercel.json`
- Refactored API bootstrap so long-running Node and serverless use the same Nest setup.
- Tightened CORS behavior in source-controlled API setup to exact configured origins instead of accepting any `*.vercel.app` origin.
- Registered Nest throttling globally and added stricter upload throttling.
- Added runtime validation for category/product admin write payloads.
- Added hash-based duplicate-upload no-op behavior to the importer and test coverage for it.
- Added Dockerfiles for `apps/api`, `apps/web`, and `apps/admin` plus `.dockerignore` to avoid copying local env/build artifacts.
- Removed hardcoded production API domain from web/admin source; production API base now comes from env or same-origin `/api/v1` fallback.
- Added production-oriented public IA/routes:
  - `/`
  - `/prices`
  - `/prices/[slug]`
  - `/markets`
  - `/markets/[market]`
  - `/changes`
  - `/history`
  - `/search`
  - `/about`
  - `/methodology`
  - `/source/[date]`
- Redesigned the public homepage around the requested Bangladesh market/data-product visual direction.
- Added generated product-art SVG data URIs for missing product imagery, while preserving existing exact product image files when present.
- Added public `robots.txt` and `sitemap.xml` basics.
- Expanded admin route IA and sidebar with Dashboard, Daily Upload, Price Data, Products, Markets, Import History, Validation Errors, Published Data, System, Audit Log.
- Added admin import stepper/validation preview UI.
- Fixed admin audit view field mismatch against the current API response shape.
- Updated README deployment notes with Vercel API requirements, health checks, Docker hosting notes, and rollback guidance.

## Still open / blocked

- **Production stability verification is blocked** until Vercel credentials/log access and deploy access are available. The live API still needs redeploying with the new source-controlled handler before `/health`, `/auth/login`, `/auth/refresh`, and `/products` can be confirmed.
- **Local validation is blocked** because this environment has Node `v12.22.9` and no `pnpm`; the repo requires Node 22 and pnpm. No commit has been made because the build/test suite could not be run.
- Some admin screens are production IA scaffolds rather than full CRUD workflows because the backend does not yet model per-market manual price entries, validation records, market entities, or import preview records as first-class APIs.
- Product social preview image generation is not implemented; static SEO files and per-page metadata were added where practical.
- Dynamic sitemap generation for product/market/source pages should be added once the deployment API/domain is stable.

## Deploy current main from scratch

1. Install toolchain:

```bash
nvm use 22
corepack enable
pnpm install --frozen-lockfile
```

2. Configure env files without committing secrets:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

Required production API env vars:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CORS_ORIGIN`
- `NODE_ENV=production`

Frontend API env vars:

- `NUXT_PUBLIC_API_BASE=https://<api-domain>/api/v1`
- `VITE_API_BASE=https://<api-domain>/api/v1`

3. Apply migrations:

```bash
pnpm migrate
```

4. Validate before deploy:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

5. Deploy API:

- Recommended: deploy `apps/api` as an always-on Node service using `apps/api/Dockerfile`.
- Existing Vercel option: deploy `apps/api` with `apps/api/vercel.json`; confirm the build produces `dist/serverless.js` and `api/index.js` is used as the function.

6. Deploy web/admin:

- Set `NUXT_PUBLIC_API_BASE` and `VITE_API_BASE` to the deployed API origin.
- Deploy `apps/web` as a Nuxt SSR server using `apps/web/Dockerfile` or equivalent Node host.
- Deploy `apps/admin` as static files using `apps/admin/Dockerfile` or any CDN/static host under `/admin`.

7. Post-deploy health checks:

```bash
curl https://<api-domain>/health
curl https://<api-domain>/api/v1/products?limit=1
curl -i -X POST https://<api-domain>/api/v1/auth/login \
  -H 'content-type: application/json' \
  --data '{"email":"<admin-email>","password":"<admin-password>"}'
```

8. Rollback:

- Redeploy the previous working app version.
- If a bad bulletin was published, use the admin import undo flow to repoint the report to the prior revision.
