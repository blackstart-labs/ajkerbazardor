import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ZodValidationPipe } from '../src/common/pipes/zod-validation.pipe.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { eq } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import { DRIZZLE } from '../src/drizzle/drizzle.module.js';
import { AuthService } from '../src/auth/auth.service.js';
import * as schema from '../src/drizzle/schema.js';

describe('Catalogue, Corrections & Audit E2E', () => {
  let app: NestFastifyApplication;
  let client: ReturnType<typeof createClient>;
  let db: LibSQLDatabase<typeof schema>;
  let adminToken: string;
  const testDbPath = path.join(__dirname, `test-catalogue-${Date.now()}.db`);

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

    const authService = moduleFixture.get(AuthService);

    // Clean dynamic tables for isolated test runs
    await client.execute('DELETE FROM price_entry');
    await client.execute('DELETE FROM revision');
    await client.execute('DELETE FROM report');
    await client.execute('DELETE FROM product');
    await client.execute('DELETE FROM audit_log');

    // Seed admin & get token
    await authService.seedAdminIfEmpty();
    const validated = await authService.validateUser(
      process.env.ADMIN_EMAIL || 'admin@ajkerbazardor.local',
      process.env.ADMIN_PASSWORD || 'AdminPassword123!',
    );
    const loginRes = await authService.login(validated);
    adminToken = loginRes.accessToken;
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

  describe('Categories CRUD', () => {
    let createdCatId: number;

    it('GET /api/v1/categories should list seeded categories', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/categories',
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data.some((c: { slug: string }) => c.slug === 'chal')).toBe(true);
    });

    it('POST /api/v1/categories should create new category', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/categories',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          slug: 'test-dry-fruits',
          nameBn: 'ড্রাই ফ্রুটস',
          sortOrder: 99,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.slug).toBe('test-dry-fruits');
      createdCatId = body.data.id;
    });

    it('PUT /api/v1/categories/:id should update category', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/categories/${createdCatId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          nameBn: 'শুকনো ফল',
        },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.nameBn).toBe('শুকনো ফল');
    });

    it('PUT /api/v1/categories/reorder should reorder categories', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/v1/categories/reorder',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          orders: [{ id: createdCatId, sortOrder: 1 }],
        },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      const updated = body.data.find((c: { id: number }) => c.id === createdCatId);
      expect(updated.sortOrder).toBe(1);
    });

    it('DELETE /api/v1/categories/:id should delete empty category', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/categories/${createdCatId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Group Map CRUD', () => {
    let createdMapId: number;

    it('GET /api/v1/admin/group-maps should list mappings', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/group-maps',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('POST /api/v1/admin/group-maps should create mapping', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/group-maps',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          sourceGroupKey: 'test_group',
          categoryId: 1,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      createdMapId = body.data.id;
    });

    it('PUT /api/v1/admin/group-maps/:id should update mapping', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/group-maps/${createdMapId}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          categoryId: 2,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.categoryId).toBe(2);
    });

    it('DELETE /api/v1/admin/group-maps/:id should delete mapping', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/group-maps/${createdMapId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Products CRUD, Review Queue & Soft Archive', () => {
    let createdProdId: number;

    it('POST /api/v1/admin/products should create product and auto-compute nameKey', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          nameBn: 'কাঁচা মরিচ (দেশি)',
          categoryId: 1,
          unitId: 1, // kg
          needsReview: true,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.nameKey).toBe('কাঁচা মরিচ দেশি');
      expect(body.data.needsReview).toBe(true);
      createdProdId = body.data.id;
    });

    it('POST /api/v1/admin/products duplicate should be rejected', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/products',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          nameBn: 'কাঁচা মরিচ  (দেশি)', // different spaces, same nameKey
          categoryId: 1,
          unitId: 1,
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('GET /api/v1/admin/review-queue should list product needing review', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/review-queue',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.items.some((p: { id: number }) => p.id === createdProdId)).toBe(true);
    });

    it('PUT /api/v1/admin/review-queue/:id/approve should approve product', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/review-queue/${createdProdId}/approve`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          nameBn: 'দেশি কাঁচা মরিচ',
        },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data.needsReview).toBe(false);
      expect(body.data.nameBn).toBe('দেশি কাঁচা মরিচ');
    });

    it('PUT /api/v1/admin/products/:id/archive should soft-archive product', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/products/${createdProdId}/archive`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);

      // Verify omitted by default from product list
      const listRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/products',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const listBody = JSON.parse(listRes.payload);
      expect(listBody.data.items.some((p: { id: number }) => p.id === createdProdId)).toBe(false);

      // Verify included when includeArchived=true
      const archRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/products?includeArchived=true',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const archBody = JSON.parse(archRes.payload);
      expect(archBody.data.items.some((p: { id: number }) => p.id === createdProdId)).toBe(true);
    });

    it('PUT /api/v1/admin/products/:id/unarchive should restore product', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/api/v1/admin/products/${createdProdId}/unarchive`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it('DELETE /api/v1/admin/products/:id should hard delete when no price history exists', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/products/${createdProdId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Manual Price Corrections', () => {
    it('POST /api/v1/admin/reports/:date/corrections should apply price override and create manual revision', async () => {
      // Create a test product
      const [prod] = await db
        .insert(schema.products)
        .values({
          slug: 'test-dragon-fruit',
          nameBn: 'ড্রাগন ফল লাল',
          nameKey: 'ড্রাগন ফল লাল',
          categoryId: 1,
          unitId: 1,
        })
        .returning();

      expect(prod).toBeDefined();

      const prodId = prod?.id ?? 0;

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/reports/2026-09-24/corrections',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          entries: [
            {
              productId: prodId,
              min: 150,
              max: 160,
              lastChangedOn: '2026-09-24',
            },
          ],
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.date).toBe('2026-09-24');
      expect(body.data.entriesCount).toBe(1);

      // Verify report and revision in DB
      const [rep] = await db.select().from(schema.reports).where(eq(schema.reports.date, '2026-09-24'));
      expect(rep).toBeDefined();
      expect(rep?.currentRevisionId).toBe(body.data.revisionId);

      const [rev] = await db.select().from(schema.revisions).where(eq(schema.revisions.id, body.data.revisionId));
      expect(rev?.source).toBe('manual');

      // Verify cannot hard delete prod now that it has price history!
      const delRes = await app.inject({
        method: 'DELETE',
        url: `/api/v1/admin/products/${prodId}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(delRes.statusCode).toBe(400);
      expect(delRes.payload).toContain('price entries');
    });
  });

  describe('Audit Log Endpoint', () => {
    it('GET /api/v1/admin/audit should return recorded mutations', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/audit',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.ok).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body.data.some((a: { entity: string }) => a.entity === 'product' || a.entity === 'category')).toBe(true);
    });
  });
});
