import { Test, type TestingModule } from '@nestjs/testing';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { eq } from 'drizzle-orm';
import { TcbParserService } from '../src/importer/tcb-parser.service.js';
import { ImportService } from '../src/importer/import.service.js';
import { DRIZZLE } from '../src/drizzle/drizzle.module.js';
import * as schema from '../src/drizzle/schema.js';

describe('TCB Parser & Import Pipeline', () => {
  const dbFile = path.join(__dirname, 'test-import.db');
  let client: ReturnType<typeof createClient>;
  let db: ReturnType<typeof drizzle>;
  let parser: TcbParserService;
  let importService: ImportService;

  const file22 = path.join(__dirname, '../../../reference/tcb-2026-09-22.xlsx');
  const file23 = path.join(__dirname, '../../../reference/tcb-2026-09-23.xlsx');

  beforeAll(async () => {
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
    client = createClient({ url: `file:${dbFile}` });
    db = drizzle(client, { schema });

    // Apply migrations
    const migrationsDir = path.join(__dirname, '../drizzle/migrations');
    for (const file of ['0001_initial.sql', '0002_seed.sql']) {
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const stripped = sqlContent
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

    // Insert user for import author
    await client.execute({
      sql: 'INSERT INTO user (id, email, password_hash, role) VALUES (1, ?, ?, ?)',
      args: ['admin@bazardor.test', 'hash', 'admin'],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TcbParserService,
        ImportService,
        {
          provide: DRIZZLE,
          useValue: db,
        },
      ],
    }).compile();

    parser = module.get<TcbParserService>(TcbParserService);
    importService = module.get<ImportService>(ImportService);
  });

  afterAll(async () => {
    client.close();
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  describe('TcbParserService', () => {
    it('parses tcb-2026-09-22.xlsx with exact metadata and 60 products', () => {
      const buf = fs.readFileSync(file22);
      const res = parser.parse(buf);

      expect(res.serialNo).toBe(235);
      expect(res.date).toBe('2026-09-22');
      expect(res.memoNo).toContain('২৬.০৫.০০০০.০১৭.৩১.০১.২৬-৭৪৪');
      expect(res.products.length).toBe(60);
      expect(res.markets.length).toBeGreaterThan(0);
      expect(res.markets).toContain('মিরপুর-৬');

      // Check potato parsed with lastChangedOn or price range
      const potato = res.products.find((p) => p.nameBn.includes('আলু'));
      expect(potato).toBeDefined();
      expect(potato?.unitCode).toBe('কেজি');
      expect(potato?.min).toBe(25);
      expect(potato?.max).toBe(30);
    });

    it('parses tcb-2026-09-23.xlsx with serial 236 and 60 products', () => {
      const buf = fs.readFileSync(file23);
      const res = parser.parse(buf);

      expect(res.serialNo).toBe(236);
      expect(res.date).toBe('2026-09-23');
      expect(res.memoNo).toContain('২৬.০৫.০০০০.০১৭.৩১.০১.২৬-৭৪৭');
      expect(res.products.length).toBe(60);
    });
  });

  describe('ImportService', () => {
    it('imports tcb-2026-09-22.xlsx atomically into database', async () => {
      const buf = fs.readFileSync(file22);
      const result = await importService.importTcbFile(buf, 'tcb-2026-09-22.xlsx', 1);

      expect(result.productCount).toBe(60);
      expect(result.newProductCount).toBe(60);
      expect(result.status).toBe('published');
      expect(result.date).toBe('2026-09-22');

      // Verify report in db
      const rep = await db.select().from(schema.reports).where(eq(schema.reports.date, '2026-09-22'));
      expect(rep.length).toBe(1);
      expect(rep[0]?.status).toBe('published');
      expect(rep[0]?.currentRevisionId).toBe(result.revisionId);

      // Verify potato category remapping override (potato in TCB is in ডাল, but overridden to সবজি)
      const sobjiCategory = await db.select().from(schema.categories).where(eq(schema.categories.slug, 'sobji'));
      const sobjiId = sobjiCategory[0]?.id;
      const dbPotato = await db.select().from(schema.products).where(eq(schema.products.nameKey, 'আলু নতুন/পুরাতন'));
      expect(dbPotato.length).toBe(1);
      expect(dbPotato[0]?.categoryId).toBe(sobjiId);

      // Verify 60 price entries
      const prices = await db
        .select()
        .from(schema.priceEntries)
        .where(eq(schema.priceEntries.revisionId, result.revisionId));
      expect(prices.length).toBe(60);
    });

    it('imports tcb-2026-09-23.xlsx reusing existing products (0 new products)', async () => {
      const buf = fs.readFileSync(file23);
      const result = await importService.importTcbFile(buf, 'tcb-2026-09-23.xlsx', 1);

      expect(result.productCount).toBe(60);
      expect(result.newProductCount).toBe(0); // All 60 products already exist!
      expect(result.date).toBe('2026-09-23');

      // Total products in DB must still be exactly 60
      const totalProds = await db.select().from(schema.products);
      expect(totalProds.length).toBe(60);
    });

    it('supports undoing revisions for a report', async () => {
      // Re-import day 23 with a second revision
      const buf = fs.readFileSync(file23);
      const secondImport = await importService.importTcbFile(buf, 'tcb-2026-09-23-v2.xlsx', 1);

      const repBefore = await db.select().from(schema.reports).where(eq(schema.reports.date, '2026-09-23'));
      expect(repBefore[0]?.currentRevisionId).toBe(secondImport.revisionId);

      // Undo
      const undoRes = await importService.undoRevision(secondImport.reportId, 1);
      expect(undoRes.previousRevisionId).toBeDefined();

      const repAfter = await db.select().from(schema.reports).where(eq(schema.reports.date, '2026-09-23'));
      expect(repAfter[0]?.currentRevisionId).toBe(undoRes.previousRevisionId);
      expect(repAfter[0]?.currentRevisionId).not.toBe(secondImport.revisionId);
    });
  });
});
