import { Injectable, Inject, BadRequestException, Optional } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import * as schema from '../drizzle/schema.js';

import { AuditService } from '../audit/audit.service.js';

import { CachePurgerService } from '../read/cache-purger.service.js';

export interface CorrectionEntryDto {
  productId: number;
  min: number | null;
  max: number | null;
  weekAgoMin?: number | null;
  weekAgoMax?: number | null;
  monthAgoMin?: number | null;
  monthAgoMax?: number | null;
  yearAgoMin?: number | null;
  yearAgoMax?: number | null;
  lastChangedOn?: string | null;
}

export interface SaveCorrectionsDto {
  entries: CorrectionEntryDto[];
}

@Injectable()
export class CorrectionsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>,
    @Inject(AuditService) private readonly auditService: AuditService,
    @Optional() @Inject(CachePurgerService) private readonly purger?: CachePurgerService,
  ) {}

  async applyCorrections(date: string, dto: SaveCorrectionsDto, userId: number) {
    if (!dto.entries || dto.entries.length === 0) {
      throw new BadRequestException('At least one price entry must be provided');
    }

    const now = new Date().toISOString();

    // 1. Get or create report for date
    let [report] = await this.db.select().from(schema.reports).where(eq(schema.reports.date, date)).limit(1);

    if (!report) {
      const [newReport] = await this.db
        .insert(schema.reports)
        .values({
          date,
          status: 'published',
        })
        .returning();
      report = newReport;
    }

    if (!report) {
      throw new Error('Failed to resolve report for date: ' + date);
    }

    const currentReport = report;

    // 2. Fetch existing price entries from current revision to preserve unmodified ones
    const existingEntriesMap = new Map<number, typeof schema.priceEntries.$inferSelect>();
    if (currentReport.currentRevisionId) {
      const existingEntries = await this.db
        .select()
        .from(schema.priceEntries)
        .where(eq(schema.priceEntries.revisionId, currentReport.currentRevisionId));

      for (const entry of existingEntries) {
        existingEntriesMap.set(entry.productId, entry);
      }
    }

    // 3. Create new manual revision
    const [revision] = await this.db
      .insert(schema.revisions)
      .values({
        reportId: currentReport.id,
        source: 'manual',
        stats: JSON.stringify({
          type: 'manual_correction',
          entriesModified: dto.entries.length,
        }),
        warnings: '[]',
        createdBy: userId,
        createdAt: now,
      })
      .returning();

    if (!revision) {
      throw new Error('Failed to create manual revision');
    }

    const currentRevision = revision;

    // 4. Merge incoming entries with existing entries
    const finalEntriesToInsert = new Map<number, Omit<typeof schema.priceEntries.$inferInsert, 'id'>>();

    for (const [prodId, existing] of existingEntriesMap.entries()) {
      finalEntriesToInsert.set(prodId, {
        revisionId: currentRevision.id,
        productId: prodId,
        min: existing.min,
        max: existing.max,
        weekAgoMin: existing.weekAgoMin,
        weekAgoMax: existing.weekAgoMax,
        monthAgoMin: existing.monthAgoMin,
        monthAgoMax: existing.monthAgoMax,
        yearAgoMin: existing.yearAgoMin,
        yearAgoMax: existing.yearAgoMax,
        lastChangedOn: existing.lastChangedOn,
      });
    }

    for (const correction of dto.entries) {
      const base = finalEntriesToInsert.get(correction.productId);
      finalEntriesToInsert.set(correction.productId, {
        revisionId: currentRevision.id,
        productId: correction.productId,
        min: correction.min,
        max: correction.max,
        weekAgoMin: correction.weekAgoMin ?? base?.weekAgoMin ?? null,
        weekAgoMax: correction.weekAgoMax ?? base?.weekAgoMax ?? null,
        monthAgoMin: correction.monthAgoMin ?? base?.monthAgoMin ?? null,
        monthAgoMax: correction.monthAgoMax ?? base?.monthAgoMax ?? null,
        yearAgoMin: correction.yearAgoMin ?? base?.yearAgoMin ?? null,
        yearAgoMax: correction.yearAgoMax ?? base?.yearAgoMax ?? null,
        lastChangedOn: correction.lastChangedOn ?? base?.lastChangedOn ?? null,
      });
    }

    // Insert new entries
    const valuesArray = Array.from(finalEntriesToInsert.values());
    if (valuesArray.length > 0) {
      await this.db.insert(schema.priceEntries).values(valuesArray);
    }

    // 5. Supersede old revision if any
    if (currentReport.currentRevisionId) {
      await this.db
        .update(schema.revisions)
        .set({ supersededAt: now })
        .where(eq(schema.revisions.id, currentReport.currentRevisionId));
    }

    // 6. Update report to point to new revision
    await this.db
      .update(schema.reports)
      .set({
        currentRevisionId: currentRevision.id,
        status: 'published',
      })
      .where(eq(schema.reports.id, currentReport.id));

    // 7. Audit log
    await this.auditService.log({
      userId,
      action: 'price_correction',
      entity: 'report',
      entityId: currentReport.id,
      diff: {
        date,
        newRevisionId: currentRevision.id,
        entriesCount: dto.entries.length,
      },
    });

    this.purger?.purge();

    return {
      success: true,
      reportId: currentReport.id,
      revisionId: currentRevision.id,
      date,
      entriesCount: valuesArray.length,
    };
  }
}
