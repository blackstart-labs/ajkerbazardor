import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ZodValidationPipe } from '../src/common/pipes/zod-validation.pipe.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { DRIZZLE } from '../src/drizzle/drizzle.module.js';
import { ImportService } from '../src/importer/import.service.js';
import * as schema from '../src/drizzle/schema.js';

describe('Public Read APIs E2E', () => {
  let app: NestFastifyApplication;
  let client: ReturnType<typeof createClient>;
  let db: LibSQLDatabase<typeof schema>;
  const testDbPath = path.join(__dirname, `test-read-${Date.now()}.db`);

  beforeAll(async () => {
    client = createClient({ url: `file:${testDbPath}` });
    db = drizzle(client, { schema });

    // Apply migrations before initializing app
    const migrationsDir = path.join(__dirname, '../drizzle/migrations');
    for (const file of ['0001_initial.sql', '0002_seed.sql']) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const stripped = content
        .split('\n')
        .map((l) => {
          const idx = l.indexOf('--');
          return idx >= 0 ? l.slice(0, idx) : l;
        })
        .join('\n');
      const stmts = stripped
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const stmt of stmts) {
        await client.execute(stmt);
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DRIZZLE)
      .useValue(db)
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Import the two fixture bulletins to populate realistic multi-day price data
    const importService = moduleFixture.get(ImportService);
    const file22 = path.join(__dirname, '../../../reference/tcb-2026-09-22.xlsx');
    const file23 = path.join(__dirname, '../../../reference/tcb-2026-09-23.xlsx');

    const buf22 = fs.readFileSync(file22);
    await importService.importTcbFile(buf22, 'tcb-2026-09-22.xlsx', 1);

    const buf23 = fs.readFileSync(file23);
    await importService.importTcbFile(buf23, 'tcb-2026-09-23.xlsx', 1);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    client?.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('GET /api/v1/reports/latest & /reports/:date', () => {
    it('returns latest published report with summary stats', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/latest',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.date).toBe('2026-09-23');
      expect(body.data.serialNo).toBe(236);
      expect(body.data.summary.totalProducts).toBeGreaterThan(0);
      expect(body.data.summary.averageChangePct).toBeDefined();
    });

    it('returns published report by specific date', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/2026-09-22',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.date).toBe('2026-09-22');
      expect(body.data.serialNo).toBe(235);
    });

    it('returns 404 for non-existent report date', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/1999-01-01',
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/products', () => {
    it('lists storefront products with price range, change stats, and sparkline', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/products?limit=10',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.items.length).toBeLessThanOrEqual(10);
      expect(body.data.total).toBeGreaterThan(0);

      const first = body.data.items[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('slug');
      expect(first).toHaveProperty('nameBn');
      expect(first).toHaveProperty('category');
      expect(first).toHaveProperty('unit');
      expect(first.price).toHaveProperty('min');
      expect(first.price).toHaveProperty('max');
      expect(first.price).toHaveProperty('mid');
      expect(first).toHaveProperty('sparkline');
    });

    it('filters products by search query q in Bangla or Latin', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/products?q=আলু',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.items.length).toBeGreaterThan(0);
      for (const item of body.data.items) {
        expect(item.nameBn.includes('আলু') || item.slug.includes('alu')).toBe(true);
      }
    });

    it('sorts products by price_desc', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/products?sort=price_desc&limit=5',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const items = body.data.items;
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].price.mid).toBeGreaterThanOrEqual(items[i].price.mid);
      }
    });
  });

  describe('GET /api/v1/products/:slug', () => {
    it('returns detailed product PDP with 4 context points (today, week, month, year)', async () => {
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/products?limit=1',
      });
      const slug = JSON.parse(listRes.payload).data.items[0].slug;

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/products/${slug}`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.slug).toBe(slug);
      expect(body.data.context).toHaveProperty('today');
      expect(body.data.context).toHaveProperty('weekAgo');
      expect(body.data.context).toHaveProperty('monthAgo');
      expect(body.data.context).toHaveProperty('yearAgo');
    });

    it('returns 404 for non-existent product slug', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/products/non-existent-product-12345',
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/products/:slug/history', () => {
    it('returns time series array with min, max, mid, and change points', async () => {
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/products?limit=1',
      });
      const slug = JSON.parse(listRes.payload).data.items[0].slug;

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/products/${slug}/history?range=30d`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data[0]).toHaveProperty('date');
      expect(body.data[0]).toHaveProperty('mid');
    });
  });

  describe('GET /api/v1/products/compare', () => {
    it('compares up to 4 products and returns aligned time series', async () => {
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/products?limit=2',
      });
      const items = JSON.parse(listRes.payload).data.items;
      const slugs = `${items[0].slug},${items[1].slug}`;

      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/products/compare?slugs=${slugs}&range=30d`,
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.products.length).toBe(2);
      expect(body.data.series.length).toBeGreaterThan(0);
    });

    it('rejects comparison of more than 4 products', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/products/compare?slugs=a,b,c,d,e',
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/v1/dashboard/*', () => {
    it('GET /dashboard/summary returns market overview, counts, and top movers', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/summary',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.totalTracked).toBeGreaterThan(0);
      expect(body.data.upCount + body.data.downCount + body.data.sameCount).toBe(body.data.totalTracked);
    });

    it('GET /dashboard/movers returns risers and fallers', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/movers?period=day&limit=5',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data).toHaveProperty('risers');
      expect(body.data).toHaveProperty('fallers');
    });

    it('GET /dashboard/index returns category Bazar Index rebased to 100', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/index?range=30d',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.series.length).toBeGreaterThan(0);
      expect(body.data.disclaimer).toBeDefined();
    });

    it('GET /dashboard/heatmap returns category product rows with date cells', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/heatmap?days=14',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.dates.length).toBeGreaterThan(0);
      expect(body.data.categories.length).toBeGreaterThan(0);
    });
  });

  describe('HTTP Caching & ETag', () => {
    it('sets ETag and Cache-Control headers on read requests', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/latest',
      });

      expect(res.statusCode).toBe(200);
      const etag = res.headers['etag'];
      const cacheControl = res.headers['cache-control'];

      expect(etag).toBeDefined();
      expect(cacheControl).toContain('public');
      expect(cacheControl).toContain('s-maxage=300');

      // Conditional GET with If-None-Match should return 304 Not Modified
      const res304 = await app.inject({
        method: 'GET',
        url: '/api/v1/reports/latest',
        headers: {
          'if-none-match': etag as string,
        },
      });

      expect(res304.statusCode).toBe(304);
    });
  });
});
