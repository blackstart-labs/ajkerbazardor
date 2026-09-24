import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc, lt, and } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type * as schema from '../drizzle/schema.js';
import { reports, priceEntries, products } from '../drizzle/schema.js';
import { mid, changePct, direction, roundPct } from '@ajkerbazardor/shared';

export interface ReportSummaryStats {
  totalProducts: number;
  countUp: number;
  countDown: number;
  countSame: number;
  shareUp: number;
  shareDown: number;
  shareSame: number;
  averageChangePct: number;
  topRiser: { slug: string; nameBn: string; changePct: number; min: number | null; max: number | null } | null;
  topFaller: { slug: string; nameBn: string; changePct: number; min: number | null; max: number | null } | null;
}

export interface PublishedReportDetail {
  id: number;
  date: string;
  serialNo: number | null;
  memoNo: string | null;
  markets: string[];
  compareDates: { week: string | null; month: string | null; year: string | null };
  status: 'draft' | 'published';
  summary: ReportSummaryStats;
}

@Injectable()
export class ReportsReadService {
  constructor(@Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>) {}

  async getLatestReport(): Promise<PublishedReportDetail> {
    const [latest] = await this.db
      .select()
      .from(reports)
      .where(eq(reports.status, 'published'))
      .orderBy(desc(reports.date))
      .limit(1);

    if (!latest) {
      throw new NotFoundException('No published reports available');
    }

    return this.buildReportDetail(latest);
  }

  async getReportByDate(date: string): Promise<PublishedReportDetail> {
    const [report] = await this.db
      .select()
      .from(reports)
      .where(and(eq(reports.date, date), eq(reports.status, 'published')))
      .limit(1);

    if (!report) {
      throw new NotFoundException(`Published report not found for date: ${date}`);
    }

    return this.buildReportDetail(report);
  }

  async getPublishedDates(limit = 60): Promise<string[]> {
    const rows = await this.db
      .select({ date: reports.date })
      .from(reports)
      .where(eq(reports.status, 'published'))
      .orderBy(desc(reports.date))
      .limit(limit);

    return rows.map((r) => r.date);
  }

  private async buildReportDetail(report: schema.Report): Promise<PublishedReportDetail> {
    if (!report.currentRevisionId) {
      throw new NotFoundException(`Report for ${report.date} has no active revision`);
    }

    // Find previous published report
    const [prevReport] = await this.db
      .select({ id: reports.id, date: reports.date, currentRevisionId: reports.currentRevisionId })
      .from(reports)
      .where(and(eq(reports.status, 'published'), lt(reports.date, report.date)))
      .orderBy(desc(reports.date))
      .limit(1);

    // Current revision prices
    const currentPrices = await this.db
      .select({
        productId: priceEntries.productId,
        slug: products.slug,
        nameBn: products.nameBn,
        min: priceEntries.min,
        max: priceEntries.max,
      })
      .from(priceEntries)
      .innerJoin(products, eq(priceEntries.productId, products.id))
      .where(eq(priceEntries.revisionId, report.currentRevisionId));

    // Previous revision prices map
    const prevPricesMap = new Map<number, number | null>();
    if (prevReport?.currentRevisionId) {
      const prevPrices = await this.db
        .select({
          productId: priceEntries.productId,
          min: priceEntries.min,
          max: priceEntries.max,
        })
        .from(priceEntries)
        .where(eq(priceEntries.revisionId, prevReport.currentRevisionId));

      for (const p of prevPrices) {
        prevPricesMap.set(p.productId, mid(p.min, p.max));
      }
    }

    let countUp = 0;
    let countDown = 0;
    let countSame = 0;
    const changePcts: number[] = [];

    let topRiser: ReportSummaryStats['topRiser'] = null;
    let topFaller: ReportSummaryStats['topFaller'] = null;

    for (const p of currentPrices) {
      const currentMid = mid(p.min, p.max);
      const prevMid = prevPricesMap.get(p.productId) ?? null;
      const pct = changePct(currentMid, prevMid);
      const dir = direction(pct);

      if (dir === 'up') {
        countUp++;
      } else if (dir === 'down') {
        countDown++;
      } else {
        countSame++;
      }

      if (pct !== null) {
        changePcts.push(pct);
        const rounded = roundPct(pct);

        if (!topRiser || rounded > topRiser.changePct) {
          topRiser = { slug: p.slug, nameBn: p.nameBn, changePct: rounded, min: p.min, max: p.max };
        }
        if (!topFaller || rounded < topFaller.changePct) {
          topFaller = { slug: p.slug, nameBn: p.nameBn, changePct: rounded, min: p.min, max: p.max };
        }
      }
    }

    const totalProducts = currentPrices.length;
    const shareUp = totalProducts > 0 ? roundPct((countUp / totalProducts) * 100) : 0;
    const shareDown = totalProducts > 0 ? roundPct((countDown / totalProducts) * 100) : 0;
    const shareSame = totalProducts > 0 ? roundPct((countSame / totalProducts) * 100) : 0;
    const averageChangePct =
      changePcts.length > 0 ? roundPct(changePcts.reduce((a, b) => a + b, 0) / changePcts.length) : 0;

    let markets: string[] = [];
    try {
      markets = JSON.parse(report.markets || '[]');
    } catch {
      markets = [];
    }

    let compareDates = { week: null, month: null, year: null };
    try {
      compareDates = JSON.parse(report.compareDates || '{}');
    } catch {
      compareDates = { week: null, month: null, year: null };
    }

    return {
      id: report.id,
      date: report.date,
      serialNo: report.serialNo,
      memoNo: report.memoNo,
      markets,
      compareDates,
      status: report.status,
      summary: {
        totalProducts,
        countUp,
        countDown,
        countSame,
        shareUp,
        shareDown,
        shareSame,
        averageChangePct,
        topRiser,
        topFaller,
      },
    };
  }
}
