import { Injectable, Inject, BadRequestException, Logger, Optional } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { eq, and, sql, desc, lt } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type * as schema from '../drizzle/schema.js';
import {
  reports,
  revisions,
  priceEntries,
  products,
  categories,
  units,
  groupMaps,
  auditLogs,
} from '../drizzle/schema.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { TcbParserService } from './tcb-parser.service.js';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CachePurgerService } from '../read/cache-purger.service.js';

export interface ImportResult {
  reportId: number;
  revisionId: number;
  date: string;
  serialNo: number | null;
  productCount: number;
  newProductCount: number;
  warnings: schema.Revision['warnings'];
  status: 'published';
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private readonly dateLocks = new Map<string, Promise<unknown>>();

  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
    private readonly parser: TcbParserService,
    @Optional() private readonly purger?: CachePurgerService,
  ) {}

  async importTcbFile(buffer: Buffer, fileName: string, userId: number): Promise<ImportResult> {
    const parsed = this.parser.parse(buffer);
    const date = parsed.date;

    // Mutex lock for this date to prevent concurrent duplicate imports
    while (this.dateLocks.has(date)) {
      await this.dateLocks.get(date);
    }

    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.dateLocks.set(date, lockPromise);

    try {
      return await this.executeImport(parsed, buffer, fileName, userId);
    } finally {
      this.dateLocks.delete(date);
      releaseLock();
    }
  }

  private async executeImport(
    parsed: ReturnType<TcbParserService['parse']>,
    buffer: Buffer,
    fileName: string,
    userId: number,
  ): Promise<ImportResult> {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // 1. Preload reference tables
    const allCategories = await this.db.select().from(categories);
    const categoryMap = new Map(allCategories.map((c) => [c.slug, c.id]));
    const defaultCatId = categoryMap.get('bibidh') ?? allCategories[0]?.id;
    if (!defaultCatId) {
      throw new Error('No categories found in database. Seed required.');
    }

    const allGroupMaps = await this.db.select().from(groupMaps);
    const groupToCatMap = new Map(allGroupMaps.map((g) => [g.sourceGroupKey, g.categoryId]));

    // Query product category overrides raw table
    const overrideRows = await this.db.run(sql`SELECT name_key, category_id FROM product_category_override`);
    const overrideMap = new Map<string, number>();
    for (const row of overrideRows.rows) {
      if (row[0] && row[1]) {
        overrideMap.set(String(row[0]), Number(row[1]));
      }
    }

    const allUnits = await this.db.select().from(units);
    const unitMap = new Map(allUnits.map((u) => [u.code, u.id]));

    // 2. Resolve or create Report
    const existingReports = await this.db.select().from(reports).where(eq(reports.date, parsed.date)).limit(1);
    let reportId: number;

    if (existingReports.length > 0 && existingReports[0]) {
      reportId = existingReports[0].id;
      // Update metadata
      await this.db
        .update(reports)
        .set({
          serialNo: parsed.serialNo ?? existingReports[0].serialNo,
          memoNo: parsed.memoNo ?? existingReports[0].memoNo,
          markets: JSON.stringify(parsed.markets),
          compareDates: JSON.stringify(parsed.compareDates),
        })
        .where(eq(reports.id, reportId));
    } else {
      const insertedReport = await this.db
        .insert(reports)
        .values({
          date: parsed.date,
          serialNo: parsed.serialNo,
          memoNo: parsed.memoNo,
          markets: JSON.stringify(parsed.markets),
          compareDates: JSON.stringify(parsed.compareDates),
          status: 'published',
        })
        .returning({ id: reports.id });

      const firstInserted = insertedReport[0];
      if (!firstInserted) {
        throw new Error('Failed to create report record');
      }
      reportId = firstInserted.id;
    }

    // 3. Resolve products & prepare price entries
    let newProductCount = 0;
    const priceEntryValues: schema.NewPriceEntry[] = [];

    for (const item of parsed.products) {
      // Resolve Unit ID
      let unitId = unitMap.get(item.unitCode);
      if (!unitId) {
        const insUnit = await this.db
          .insert(units)
          .values({
            code: item.unitCode,
            labelBn: item.unitBn,
          })
          .returning({ id: units.id });
        const newU = insUnit[0];
        if (newU) {
          unitId = newU.id;
          unitMap.set(item.unitCode, unitId);
        } else {
          throw new Error(`Failed to insert unit: ${item.unitCode}`);
        }
      }

      // Resolve Category ID: override -> group map -> default
      let categoryId = overrideMap.get(item.nameKey);
      if (!categoryId) {
        for (const [ovKey, ovCatId] of overrideMap.entries()) {
          if (item.nameKey.includes(ovKey) || item.nameBn.includes(ovKey)) {
            categoryId = ovCatId;
            break;
          }
        }
      }
      if (!categoryId) {
        categoryId = groupToCatMap.get(item.group);
      }
      if (!categoryId) {
        categoryId = defaultCatId;
      }

      // Resolve Product
      const existingProduct = await this.db
        .select()
        .from(products)
        .where(and(eq(products.nameKey, item.nameKey), eq(products.unitId, unitId)))
        .limit(1);

      let productId: number;
      if (existingProduct.length > 0 && existingProduct[0]) {
        productId = existingProduct[0].id;
      } else {
        const slug = `${item.nameKey.replace(/\s+/g, '-')}-${unitId}-${Date.now() % 10000}`;
        const insProduct = await this.db
          .insert(products)
          .values({
            slug,
            nameBn: item.nameBn,
            nameKey: item.nameKey,
            categoryId,
            unitId,
            aliases: JSON.stringify([item.nameBn]),
            needsReview: true,
            sortOrder: 0,
          })
          .returning({ id: products.id });
        const newP = insProduct[0];
        if (!newP) throw new Error(`Failed to insert product: ${item.nameBn}`);
        productId = newP.id;
        newProductCount++;
      }

      priceEntryValues.push({
        revisionId: 0, // set after revision creation
        productId,
        min: item.min,
        max: item.max,
        weekAgoMin: item.weekAgoMin,
        weekAgoMax: item.weekAgoMax,
        monthAgoMin: item.monthAgoMin,
        monthAgoMax: item.monthAgoMax,
        yearAgoMin: item.yearAgoMin,
        yearAgoMax: item.yearAgoMax,
        lastChangedOn: item.lastChangedOn,
      });
    }

    // 4. Create Revision
    const stats = {
      productCount: parsed.products.length,
      newProducts: newProductCount,
      changedItemsWithDate: parsed.products.filter((p) => p.lastChangedOn !== null).length,
    };

    const insertedRev = await this.db
      .insert(revisions)
      .values({
        reportId,
        source: 'tcb_import',
        fileName,
        sha256,
        rawFile: buffer,
        stats: JSON.stringify(stats),
        warnings: JSON.stringify(parsed.warnings),
        createdBy: userId,
      })
      .returning({ id: revisions.id });

    const rev = insertedRev[0];
    if (!rev) throw new Error('Failed to create revision record');
    const revisionId = rev.id;

    // 5. Insert Price Entries with revisionId
    for (const pe of priceEntryValues) {
      pe.revisionId = revisionId;
      await this.db.insert(priceEntries).values(pe);
    }

    // 6. Update Report's current revision and status
    await this.db
      .update(reports)
      .set({
        currentRevisionId: revisionId,
        status: 'published',
      })
      .where(eq(reports.id, reportId));

    // 7. Audit log
    await this.db.insert(auditLogs).values({
      userId,
      action: 'tcb_import',
      entity: 'report',
      entityId: reportId,
      diff: JSON.stringify({ revisionId, fileName, stats, warningsCount: parsed.warnings.length }),
    });

    this.logger.warn(
      `Successfully imported TCB bulletin for ${parsed.date} (rev ${revisionId}, ${parsed.products.length} products)`,
    );

    this.purger?.purge();

    return {
      reportId,
      revisionId,
      date: parsed.date,
      serialNo: parsed.serialNo,
      productCount: parsed.products.length,
      newProductCount,
      warnings: JSON.stringify(parsed.warnings),
      status: 'published',
    };
  }

  async undoRevision(reportId: number, userId: number): Promise<{ previousRevisionId: number | null }> {
    const reportList = await this.db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    const report = reportList[0];
    if (!report || !report.currentRevisionId) {
      throw new BadRequestException('Report not found or has no current revision');
    }

    const prevRevs = await this.db
      .select()
      .from(revisions)
      .where(and(eq(revisions.reportId, reportId), lt(revisions.id, report.currentRevisionId)))
      .orderBy(desc(revisions.id))
      .limit(1);

    const prevRev = prevRevs[0];
    if (!prevRev) {
      throw new BadRequestException('No previous revision exists to undo to');
    }

    await this.db
      .update(reports)
      .set({
        currentRevisionId: prevRev.id,
      })
      .where(eq(reports.id, reportId));

    await this.db.insert(auditLogs).values({
      userId,
      action: 'undo_revision',
      entity: 'report',
      entityId: reportId,
      diff: JSON.stringify({ fromRevisionId: report.currentRevisionId, toRevisionId: prevRev.id }),
    });

    this.purger?.purge();

    return { previousRevisionId: prevRev.id };
  }

  async undoRevisionById(revisionId: number, userId: number) {
    const [rev] = await this.db.select().from(revisions).where(eq(revisions.id, revisionId)).limit(1);

    if (!rev) {
      throw new BadRequestException(`Revision ${revisionId} not found`);
    }

    return this.undoRevision(rev.reportId, userId);
  }

  async getRevisions(reportId: number) {
    return this.db
      .select({
        id: revisions.id,
        reportId: revisions.reportId,
        source: revisions.source,
        fileName: revisions.fileName,
        sha256: revisions.sha256,
        stats: revisions.stats,
        warnings: revisions.warnings,
        createdAt: revisions.createdAt,
        createdBy: revisions.createdBy,
      })
      .from(revisions)
      .where(eq(revisions.reportId, reportId))
      .orderBy(desc(revisions.id));
  }

  async getAllImports(limit = 50, offset = 0) {
    return this.db
      .select({
        id: revisions.id,
        reportId: revisions.reportId,
        reportDate: reports.date,
        reportStatus: reports.status,
        isCurrent: sql<boolean>`${reports.currentRevisionId} = ${revisions.id}`,
        source: revisions.source,
        fileName: revisions.fileName,
        sha256: revisions.sha256,
        stats: revisions.stats,
        warnings: revisions.warnings,
        createdAt: revisions.createdAt,
        createdBy: revisions.createdBy,
      })
      .from(revisions)
      .innerJoin(reports, eq(revisions.reportId, reports.id))
      .orderBy(desc(revisions.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
