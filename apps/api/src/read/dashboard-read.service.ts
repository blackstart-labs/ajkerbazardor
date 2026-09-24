import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc, asc, and, isNull, inArray, lt, sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type * as schema from '../drizzle/schema.js';
import { reports, priceEntries, products, categories, units } from '../drizzle/schema.js';
import { mid, changePct, direction, roundPct, type Direction } from '@ajkerbazardor/shared';

export interface DashboardSummaryResponse {
  reportDate: string;
  serialNo: number | null;
  totalTracked: number;
  upCount: number;
  downCount: number;
  sameCount: number;
  shareUp: number;
  shareDown: number;
  shareSame: number;
  averageChangePct: number;
  topRisers: Array<{
    slug: string;
    nameBn: string;
    categoryNameBn: string;
    unitLabel: string;
    currentMid: number;
    prevMid: number | null;
    changePct: number;
    direction: Direction;
  }>;
  topFallers: Array<{
    slug: string;
    nameBn: string;
    categoryNameBn: string;
    unitLabel: string;
    currentMid: number;
    prevMid: number | null;
    changePct: number;
    direction: Direction;
  }>;
}

export interface MoverItem {
  slug: string;
  nameBn: string;
  categoryNameBn: string;
  unitLabel: string;
  currentMid: number;
  prevMid: number | null;
  changePct: number;
  direction: Direction;
}

export interface MoversResponse {
  period: 'day' | 'week' | 'month';
  date: string;
  compareDate: string | null;
  risers: MoverItem[];
  fallers: MoverItem[];
}

export interface BazarIndexResponse {
  range: string;
  startDate: string;
  endDate: string;
  categories: Array<{ id: number; slug: string; nameBn: string }>;
  series: Array<{
    date: string;
    indices: Record<string, number | null>;
  }>;
  disclaimer: string;
}

export interface HeatmapResponse {
  dates: string[];
  categories: Array<{
    id: number;
    slug: string;
    nameBn: string;
    products: Array<{
      id: number;
      slug: string;
      nameBn: string;
      unit: string;
      cells: Record<string, { mid: number | null; changePct: number | null; direction: Direction | null }>;
    }>;
  }>;
}

@Injectable()
export class DashboardReadService {
  constructor(@Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>) {}

  async getSummary(date?: string): Promise<DashboardSummaryResponse> {
    const report = await this.getTargetReport(date);
    if (!report.currentRevisionId) {
      throw new NotFoundException('Report has no current revision');
    }
    const revisionId = report.currentRevisionId;

    // Find previous published report for daily change
    const [prevReport] = await this.db
      .select({ id: reports.id, date: reports.date, currentRevisionId: reports.currentRevisionId })
      .from(reports)
      .where(and(eq(reports.status, 'published'), lt(reports.date, report.date)))
      .orderBy(desc(reports.date))
      .limit(1);

    const prevRevId = prevReport?.currentRevisionId ?? null;

    // Current revision prices
    const curPrices = await this.db
      .select({
        productId: products.id,
        slug: products.slug,
        nameBn: products.nameBn,
        categoryNameBn: categories.nameBn,
        unitLabel: units.labelBn,
        min: priceEntries.min,
        max: priceEntries.max,
      })
      .from(priceEntries)
      .innerJoin(products, eq(priceEntries.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(units, eq(products.unitId, units.id))
      .where(and(eq(priceEntries.revisionId, revisionId), isNull(products.archivedAt)));

    const prevMap = new Map<number, number>();
    if (prevRevId) {
      const prevPrices = await this.db
        .select({
          productId: priceEntries.productId,
          min: priceEntries.min,
          max: priceEntries.max,
        })
        .from(priceEntries)
        .where(eq(priceEntries.revisionId, prevRevId));

      for (const p of prevPrices) {
        const m = mid(p.min, p.max);
        if (m !== null) prevMap.set(p.productId, m);
      }
    }

    let upCount = 0;
    let downCount = 0;
    let sameCount = 0;
    const allChanges: Array<{
      slug: string;
      nameBn: string;
      categoryNameBn: string;
      unitLabel: string;
      currentMid: number;
      prevMid: number | null;
      changePct: number;
      direction: Direction;
    }> = [];

    const pcts: number[] = [];

    for (const p of curPrices) {
      const currentMid = mid(p.min, p.max);
      if (currentMid === null) continue;

      const prevMid = prevMap.get(p.productId) ?? null;
      const pct = changePct(currentMid, prevMid);
      const dir = direction(pct) ?? 'same';

      if (dir === 'up') upCount++;
      else if (dir === 'down') downCount++;
      else sameCount++;

      if (pct !== null) {
        pcts.push(pct);
        allChanges.push({
          slug: p.slug,
          nameBn: p.nameBn,
          categoryNameBn: p.categoryNameBn,
          unitLabel: p.unitLabel,
          currentMid,
          prevMid,
          changePct: roundPct(pct),
          direction: dir,
        });
      }
    }

    const totalTracked = upCount + downCount + sameCount;
    const shareUp = totalTracked > 0 ? roundPct((upCount / totalTracked) * 100) : 0;
    const shareDown = totalTracked > 0 ? roundPct((downCount / totalTracked) * 100) : 0;
    const shareSame = totalTracked > 0 ? roundPct((sameCount / totalTracked) * 100) : 0;
    const averageChangePct = pcts.length > 0 ? roundPct(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;

    const risers = allChanges.filter((c) => c.direction === 'up').sort((a, b) => b.changePct - a.changePct);
    const fallers = allChanges.filter((c) => c.direction === 'down').sort((a, b) => a.changePct - b.changePct);

    return {
      reportDate: report.date,
      serialNo: report.serialNo,
      totalTracked,
      upCount,
      downCount,
      sameCount,
      shareUp,
      shareDown,
      shareSame,
      averageChangePct,
      topRisers: risers.slice(0, 5),
      topFallers: fallers.slice(0, 5),
    };
  }

  async getMovers(period: 'day' | 'week' | 'month' = 'day', limit = 10, date?: string): Promise<MoversResponse> {
    const clampedLimit = Math.min(20, Math.max(1, limit));
    const report = await this.getTargetReport(date);
    if (!report.currentRevisionId) {
      throw new NotFoundException('Report has no current revision');
    }
    const revisionId = report.currentRevisionId;

    let compareDate: string | null = null;
    let prevPricesMap = new Map<number, number>();

    if (period === 'day') {
      // Find previous day report
      const [prevReport] = await this.db
        .select({ id: reports.id, date: reports.date, currentRevisionId: reports.currentRevisionId })
        .from(reports)
        .where(and(eq(reports.status, 'published'), lt(reports.date, report.date)))
        .orderBy(desc(reports.date))
        .limit(1);

      if (prevReport?.currentRevisionId) {
        compareDate = prevReport.date;
        const prevEntries = await this.db
          .select({
            productId: priceEntries.productId,
            min: priceEntries.min,
            max: priceEntries.max,
          })
          .from(priceEntries)
          .where(eq(priceEntries.revisionId, prevReport.currentRevisionId));

        for (const e of prevEntries) {
          const m = mid(e.min, e.max);
          if (m !== null) prevPricesMap.set(e.productId, m);
        }
      }
    } else {
      let compareDates: { week: string | null; month: string | null; year: string | null } = {
        week: null,
        month: null,
        year: null,
      };
      try {
        compareDates = JSON.parse(report.compareDates || '{}');
      } catch {
        // default
      }
      compareDate = period === 'week' ? compareDates.week : compareDates.month;
    }

    const curEntries = await this.db
      .select({
        productId: products.id,
        slug: products.slug,
        nameBn: products.nameBn,
        categoryNameBn: categories.nameBn,
        unitLabel: units.labelBn,
        min: priceEntries.min,
        max: priceEntries.max,
        weekAgoMin: priceEntries.weekAgoMin,
        weekAgoMax: priceEntries.weekAgoMax,
        monthAgoMin: priceEntries.monthAgoMin,
        monthAgoMax: priceEntries.monthAgoMax,
      })
      .from(priceEntries)
      .innerJoin(products, eq(priceEntries.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(units, eq(products.unitId, units.id))
      .where(and(eq(priceEntries.revisionId, revisionId), isNull(products.archivedAt)));

    const movers: MoverItem[] = [];

    for (const e of curEntries) {
      const curMid = mid(e.min, e.max);
      if (curMid === null) continue;

      let prevMid: number | null = null;
      if (period === 'day') {
        prevMid = prevPricesMap.get(e.productId) ?? null;
      } else if (period === 'week') {
        prevMid = mid(e.weekAgoMin, e.weekAgoMax);
      } else if (period === 'month') {
        prevMid = mid(e.monthAgoMin, e.monthAgoMax);
      }

      const pct = changePct(curMid, prevMid);
      if (pct !== null) {
        const rounded = roundPct(pct);
        const dir = direction(pct) ?? 'same';
        movers.push({
          slug: e.slug,
          nameBn: e.nameBn,
          categoryNameBn: e.categoryNameBn,
          unitLabel: e.unitLabel,
          currentMid: curMid,
          prevMid,
          changePct: rounded,
          direction: dir,
        });
      }
    }

    const risers = movers
      .filter((m) => m.direction === 'up')
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, clampedLimit);
    const fallers = movers
      .filter((m) => m.direction === 'down')
      .sort((a, b) => a.changePct - b.changePct)
      .slice(0, clampedLimit);

    return {
      period,
      date: report.date,
      compareDate,
      risers,
      fallers,
    };
  }

  async getBazarIndex(
    categorySlug?: string,
    range: '7d' | '30d' | '90d' | '1y' | 'all' = '30d',
  ): Promise<BazarIndexResponse> {
    const startDate = this.computeStartDate(range);

    // Fetch published reports in range ordered ascending
    const repList = await this.db
      .select({ id: reports.id, date: reports.date, revisionId: reports.currentRevisionId })
      .from(reports)
      .where(and(eq(reports.status, 'published'), startDate ? sql`${reports.date} >= ${startDate}` : sql`1=1`))
      .orderBy(asc(reports.date));

    if (repList.length === 0) {
      return {
        range,
        startDate: startDate ?? '',
        endDate: '',
        categories: [],
        series: [],
        disclaimer: 'এটি একটি সাধারণ গড় মূল্যসূচক, কোনো সরকারি মূল্যস্ফীতি সূচক নয়।',
      };
    }

    // Filter categories
    let catQuery = this.db.select().from(categories).orderBy(asc(categories.sortOrder));
    const allCats = await catQuery;
    const cats = categorySlug ? allCats.filter((c) => c.slug === categorySlug) : allCats;

    if (cats.length === 0) {
      throw new NotFoundException(`Category not found: ${categorySlug}`);
    }

    // Fetch products
    const activeProducts = await this.db
      .select({ id: products.id, categoryId: products.categoryId })
      .from(products)
      .where(isNull(products.archivedAt));

    const revIds = repList.map((r) => r.revisionId).filter((id): id is number => id !== null);

    // Fetch all price entries across these revisions
    const allEntries = await this.db
      .select({
        revisionId: priceEntries.revisionId,
        productId: priceEntries.productId,
        min: priceEntries.min,
        max: priceEntries.max,
      })
      .from(priceEntries)
      .where(inArray(priceEntries.revisionId, revIds));

    // Map: revisionId -> (productId -> mid)
    const revProductMid = new Map<number, Map<number, number>>();
    for (const e of allEntries) {
      const m = mid(e.min, e.max);
      if (m !== null) {
        let pMap = revProductMid.get(e.revisionId);
        if (!pMap) {
          pMap = new Map<number, number>();
          revProductMid.set(e.revisionId, pMap);
        }
        pMap.set(e.productId, m);
      }
    }

    const firstRep = repList[0];
    const lastRep = repList[repList.length - 1];
    if (!firstRep || !lastRep || !firstRep.revisionId) {
      return {
        range,
        startDate: startDate ?? '',
        endDate: '',
        categories: [],
        series: [],
        disclaimer: 'এটি একটি সাধারণ গড় মূল্যসূচক, কোনো সরকারি মূল্যস্ফীতি সূচক নয়।',
      };
    }

    const baselineRevId = firstRep.revisionId;
    const baselineMap = revProductMid.get(baselineRevId) || new Map<number, number>();

    // For each category, identify baseline products that have prices at start date
    const catBaselineProds = new Map<number, Array<{ productId: number; baseMid: number }>>();
    for (const c of cats) {
      const cProds = activeProducts.filter((p) => p.categoryId === c.id);
      const eligible: Array<{ productId: number; baseMid: number }> = [];
      for (const p of cProds) {
        const baseMid = baselineMap.get(p.id);
        if (baseMid !== undefined && baseMid > 0) {
          eligible.push({ productId: p.id, baseMid });
        }
      }
      catBaselineProds.set(c.id, eligible);
    }

    // Build series
    const series: BazarIndexResponse['series'] = [];

    for (const rep of repList) {
      const curMap = (rep.revisionId ? revProductMid.get(rep.revisionId) : null) || new Map<number, number>();
      const indices: Record<string, number | null> = {};

      for (const c of cats) {
        const eligible = catBaselineProds.get(c.id) || [];
        const ratios: number[] = [];

        for (const item of eligible) {
          const curMid = curMap.get(item.productId);
          if (curMid !== undefined && curMid > 0) {
            ratios.push((curMid / item.baseMid) * 100);
          }
        }

        if (ratios.length > 0) {
          const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
          indices[c.slug] = roundPct(mean);
        } else {
          indices[c.slug] = null;
        }
      }

      series.push({ date: rep.date, indices });
    }

    return {
      range,
      startDate: firstRep.date,
      endDate: lastRep.date,
      categories: cats.map((c) => ({ id: c.id, slug: c.slug, nameBn: c.nameBn })),
      series,
      disclaimer: 'এটি একটি সাধারণ গড় মূল্যসূচক, কোনো সরকারি মূল্যস্ফীতি সূচক নয়।',
    };
  }

  async getHeatmap(days = 14, date?: string): Promise<HeatmapResponse> {
    const clampedDays = Math.min(30, Math.max(7, days));
    const targetReport = await this.getTargetReport(date);

    // Fetch last N reports ending at targetReport
    const reps = await this.db
      .select({ id: reports.id, date: reports.date, revisionId: reports.currentRevisionId })
      .from(reports)
      .where(and(eq(reports.status, 'published'), sql`${reports.date} <= ${targetReport.date}`))
      .orderBy(desc(reports.date))
      .limit(clampedDays);

    reps.reverse(); // Chronological order
    const dates = reps.map((r) => r.date);
    const revIds = reps.map((r) => r.revisionId).filter((id): id is number => id !== null);

    // Fetch categories and active products
    const cats = await this.db.select().from(categories).orderBy(asc(categories.sortOrder));
    const prods = await this.db
      .select({
        id: products.id,
        slug: products.slug,
        nameBn: products.nameBn,
        categoryId: products.categoryId,
        unitLabel: units.labelBn,
      })
      .from(products)
      .innerJoin(units, eq(products.unitId, units.id))
      .where(isNull(products.archivedAt))
      .orderBy(asc(products.sortOrder));

    // Fetch prices across these revisions
    const allEntries = await this.db
      .select({
        revisionId: priceEntries.revisionId,
        productId: priceEntries.productId,
        min: priceEntries.min,
        max: priceEntries.max,
      })
      .from(priceEntries)
      .where(inArray(priceEntries.revisionId, revIds));

    // Map: date -> (productId -> mid)
    const revDateMap = new Map<number, string>();
    for (const r of reps) {
      if (r.revisionId) revDateMap.set(r.revisionId, r.date);
    }

    const dateProdMid = new Map<string, Map<number, number>>();
    for (const d of dates) {
      dateProdMid.set(d, new Map<number, number>());
    }

    for (const e of allEntries) {
      const d = revDateMap.get(e.revisionId);
      if (d) {
        const m = mid(e.min, e.max);
        if (m !== null) {
          const prodMap = dateProdMid.get(d);
          if (prodMap) {
            prodMap.set(e.productId, m);
          }
        }
      }
    }

    // Group by categories
    const resultCategories: HeatmapResponse['categories'] = [];

    for (const c of cats) {
      const catProds = prods.filter((p) => p.categoryId === c.id);
      if (catProds.length === 0) continue;

      const prodItems = catProds.map((p) => {
        const cells: Record<string, { mid: number | null; changePct: number | null; direction: Direction | null }> = {};

        let prevMid: number | null = null;
        for (const d of dates) {
          const curMid = dateProdMid.get(d)?.get(p.id) ?? null;
          const pct = changePct(curMid, prevMid);
          const dir = direction(pct);

          cells[d] = {
            mid: curMid,
            changePct: pct !== null ? roundPct(pct) : null,
            direction: dir,
          };

          prevMid = curMid;
        }

        return {
          id: p.id,
          slug: p.slug,
          nameBn: p.nameBn,
          unit: p.unitLabel,
          cells,
        };
      });

      resultCategories.push({
        id: c.id,
        slug: c.slug,
        nameBn: c.nameBn,
        products: prodItems,
      });
    }

    return {
      dates,
      categories: resultCategories,
    };
  }

  private async getTargetReport(date?: string): Promise<schema.Report> {
    if (date) {
      const [res] = await this.db
        .select()
        .from(reports)
        .where(and(eq(reports.date, date), eq(reports.status, 'published')))
        .limit(1);
      if (!res) {
        throw new NotFoundException(`Published report not found for date: ${date}`);
      }
      return res;
    }

    const [latest] = await this.db
      .select()
      .from(reports)
      .where(eq(reports.status, 'published'))
      .orderBy(desc(reports.date))
      .limit(1);

    if (!latest) {
      throw new NotFoundException('No published reports available');
    }

    return latest;
  }

  private computeStartDate(range: string): string | null {
    const now = new Date();
    switch (range) {
      case '7d': {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 10);
      }
      case '30d': {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return d.toISOString().slice(0, 10);
      }
      case '90d': {
        const d = new Date(now);
        d.setDate(d.getDate() - 90);
        return d.toISOString().slice(0, 10);
      }
      case '1y': {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().slice(0, 10);
      }
      case 'all':
      default:
        return null;
    }
  }
}
