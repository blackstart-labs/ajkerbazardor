import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, desc, asc, and, isNull, inArray, lt, sql } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type * as schema from '../drizzle/schema.js';
import { products, categories, units, reports, priceEntries } from '../drizzle/schema.js';
import { mid, changePct, direction, roundPct, normaliseName, type Direction } from '@ajkerbazardor/shared';

export interface ProductListFilterDto {
  category?: string | undefined;
  q?: string | undefined;
  sort?: ('price_asc' | 'price_desc' | 'change_asc' | 'change_desc' | 'name' | 'sort_order') | undefined;
  direction?: ('up' | 'down' | 'same') | undefined;
  min?: number | undefined;
  max?: number | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  date?: string | undefined;
}

export interface StorefrontProductItem {
  id: number;
  slug: string;
  nameBn: string;
  image: string | null;
  category: { id: number; slug: string; nameBn: string };
  unit: { id: number; code: string; labelBn: string };
  price: {
    min: number | null;
    max: number | null;
    mid: number | null;
    prevMin: number | null;
    prevMax: number | null;
    prevMid: number | null;
    changeAmount: number | null;
    changePct: number | null;
    direction: Direction | null;
    lastChangedOn: string | null;
  };
  sparkline: Array<{ date: string; mid: number | null }>;
}

export interface ProductDetailItem {
  id: number;
  slug: string;
  nameBn: string;
  image: string | null;
  aliases: string[];
  needsReview: boolean;
  category: { id: number; slug: string; nameBn: string };
  unit: { id: number; code: string; labelBn: string };
  currentPrice: {
    min: number | null;
    max: number | null;
    mid: number | null;
    prevMin: number | null;
    prevMax: number | null;
    prevMid: number | null;
    changeAmount: number | null;
    changePct: number | null;
    direction: Direction | null;
    lastChangedOn: string | null;
    reportDate: string;
  };
  context: {
    today: { min: number | null; max: number | null; mid: number | null; date: string };
    weekAgo: { min: number | null; max: number | null; mid: number | null; date: string | null };
    monthAgo: { min: number | null; max: number | null; mid: number | null; date: string | null };
    yearAgo: { min: number | null; max: number | null; mid: number | null; date: string | null };
  };
  sparkline: Array<{ date: string; mid: number | null }>;
}

export interface HistoryPoint {
  date: string;
  min: number | null;
  max: number | null;
  mid: number | null;
  changePct: number | null;
  direction: Direction | null;
}

export interface CompareResult {
  sameUnit: boolean;
  unit: { id: number; code: string; labelBn: string } | null;
  products: Array<{
    id: number;
    slug: string;
    nameBn: string;
    unit: { id: number; code: string; labelBn: string };
    category: { id: number; slug: string; nameBn: string };
    currentPrice: { min: number | null; max: number | null; mid: number | null };
  }>;
  series: Array<{
    date: string;
    values: Record<string, { price: number | null; rebased: number | null }>;
  }>;
}

@Injectable()
export class ProductsReadService {
  constructor(@Inject(DRIZZLE) private readonly db: LibSQLDatabase<typeof schema>) {}

  async listProducts(filter: ProductListFilterDto) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 20));

    // Determine target published report
    let targetReport: schema.Report | undefined;
    if (filter.date) {
      const res = await this.db
        .select()
        .from(reports)
        .where(and(eq(reports.date, filter.date), eq(reports.status, 'published')))
        .limit(1);
      targetReport = res[0];
    } else {
      const res = await this.db
        .select()
        .from(reports)
        .where(eq(reports.status, 'published'))
        .orderBy(desc(reports.date))
        .limit(1);
      targetReport = res[0];
    }

    if (!targetReport || !targetReport.currentRevisionId) {
      return {
        items: [],
        page,
        limit,
        total: 0,
        totalPages: 0,
        reportDate: null,
      };
    }

    // Previous published report for 1-day delta
    const prevReports = await this.db
      .select({ id: reports.id, date: reports.date, currentRevisionId: reports.currentRevisionId })
      .from(reports)
      .where(and(eq(reports.status, 'published'), lt(reports.date, targetReport.date)))
      .orderBy(desc(reports.date))
      .limit(1);
    const prevRevId = prevReports[0]?.currentRevisionId ?? null;

    // Previous price map
    const prevPriceMap = new Map<number, { min: number | null; max: number | null; mid: number | null }>();
    if (prevRevId) {
      const prevEntries = await this.db
        .select({
          productId: priceEntries.productId,
          min: priceEntries.min,
          max: priceEntries.max,
        })
        .from(priceEntries)
        .where(eq(priceEntries.revisionId, prevRevId));

      for (const e of prevEntries) {
        prevPriceMap.set(e.productId, {
          min: e.min,
          max: e.max,
          mid: mid(e.min, e.max),
        });
      }
    }

    // Query active products with category & unit
    let query = this.db
      .select({
        productId: products.id,
        productSlug: products.slug,
        productNameBn: products.nameBn,
        productNameKey: products.nameKey,
        productAliases: products.aliases,
        productImage: products.image,
        productSortOrder: products.sortOrder,
        categoryId: categories.id,
        categorySlug: categories.slug,
        categoryNameBn: categories.nameBn,
        categorySortOrder: categories.sortOrder,
        unitId: units.id,
        unitCode: units.code,
        unitLabelBn: units.labelBn,
        min: priceEntries.min,
        max: priceEntries.max,
        lastChangedOn: priceEntries.lastChangedOn,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(units, eq(products.unitId, units.id))
      .leftJoin(
        priceEntries,
        and(eq(products.id, priceEntries.productId), eq(priceEntries.revisionId, targetReport.currentRevisionId)),
      )
      .where(isNull(products.archivedAt));

    const rows = await query;

    // Filter in-memory for rich search & dynamic fields
    let items: StorefrontProductItem[] = [];

    const normQ = filter.q ? normaliseName(filter.q).toLowerCase().trim() : '';
    const rawQ = filter.q ? filter.q.toLowerCase().trim() : '';

    for (const r of rows) {
      // Category filter
      if (filter.category) {
        const isId = !Number.isNaN(Number(filter.category));
        if (isId && r.categoryId !== Number(filter.category)) {
          continue;
        }
        if (!isId && r.categorySlug !== filter.category) {
          continue;
        }
      }

      // Search filter
      if (rawQ) {
        const matchName = r.productNameBn.toLowerCase().includes(rawQ);
        const matchKey = r.productNameKey.toLowerCase().includes(normQ);
        const matchSlug = r.productSlug.toLowerCase().includes(rawQ);
        let matchAlias = false;
        try {
          const aliases: string[] = JSON.parse(r.productAliases || '[]');
          matchAlias = aliases.some((a) => a.toLowerCase().includes(rawQ) || normaliseName(a).includes(normQ));
        } catch {
          matchAlias = false;
        }

        if (!matchName && !matchKey && !matchSlug && !matchAlias) {
          continue;
        }
      }

      const curMid = mid(r.min ?? null, r.max ?? null);
      const prevData = prevPriceMap.get(r.productId) ?? null;
      const prevMid = prevData?.mid ?? null;
      const pct = changePct(curMid, prevMid);
      const roundedPct = pct !== null ? roundPct(pct) : null;
      const dir = direction(pct);
      const changeAmount = curMid !== null && prevMid !== null ? curMid - prevMid : null;

      // Price min/max filters
      if (filter.min !== undefined && curMid !== null && curMid < filter.min) {
        continue;
      }
      if (filter.max !== undefined && curMid !== null && curMid > filter.max) {
        continue;
      }

      // Direction filter
      if (filter.direction && dir !== filter.direction) {
        continue;
      }

      items.push({
        id: r.productId,
        slug: r.productSlug,
        nameBn: r.productNameBn,
        image: r.productImage,
        category: {
          id: r.categoryId,
          slug: r.categorySlug,
          nameBn: r.categoryNameBn,
        },
        unit: {
          id: r.unitId,
          code: r.unitCode,
          labelBn: r.unitLabelBn,
        },
        price: {
          min: r.min ?? null,
          max: r.max ?? null,
          mid: curMid,
          prevMin: prevData?.min ?? null,
          prevMax: prevData?.max ?? null,
          prevMid,
          changeAmount,
          changePct: roundedPct,
          direction: dir,
          lastChangedOn: r.lastChangedOn ?? null,
        },
        sparkline: [],
      });
    }

    // Sort items
    const sort = filter.sort ?? 'sort_order';
    items.sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return (a.price.mid ?? 999999) - (b.price.mid ?? 999999);
        case 'price_desc':
          return (b.price.mid ?? -1) - (a.price.mid ?? -1);
        case 'change_desc':
          return (b.price.changePct ?? -9999) - (a.price.changePct ?? -9999);
        case 'change_asc':
          return (a.price.changePct ?? 9999) - (b.price.changePct ?? 9999);
        case 'name':
          return a.nameBn.localeCompare(b.nameBn, 'bn');
        case 'sort_order':
        default:
          return a.id - b.id;
      }
    });

    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    // Fetch sparkline for paginated items (up to last 7 published report dates)
    if (paginatedItems.length > 0) {
      const recentReports = await this.db
        .select({ id: reports.id, date: reports.date, revisionId: reports.currentRevisionId })
        .from(reports)
        .where(and(eq(reports.status, 'published'), sql`${reports.date} <= ${targetReport.date}`))
        .orderBy(desc(reports.date))
        .limit(7);

      const revIds = recentReports.map((r) => r.revisionId).filter((id): id is number => id !== null);
      if (revIds.length > 0) {
        const prodIds = paginatedItems.map((p) => p.id);
        const sparkRows = await this.db
          .select({
            productId: priceEntries.productId,
            revisionId: priceEntries.revisionId,
            min: priceEntries.min,
            max: priceEntries.max,
          })
          .from(priceEntries)
          .where(and(inArray(priceEntries.productId, prodIds), inArray(priceEntries.revisionId, revIds)));

        const revDateMap = new Map<number, string>();
        for (const r of recentReports) {
          if (r.revisionId) revDateMap.set(r.revisionId, r.date);
        }

        const productSparkMap = new Map<number, Array<{ date: string; mid: number | null }>>();
        for (const r of sparkRows) {
          const d = revDateMap.get(r.revisionId);
          if (d) {
            const list = productSparkMap.get(r.productId) || [];
            list.push({ date: d, mid: mid(r.min, r.max) });
            productSparkMap.set(r.productId, list);
          }
        }

        for (const item of paginatedItems) {
          const list = productSparkMap.get(item.id) || [];
          list.sort((a, b) => a.date.localeCompare(b.date));
          item.sparkline = list;
        }
      }
    }

    return {
      items: paginatedItems,
      page,
      limit,
      total,
      totalPages,
      reportDate: targetReport.date,
    };
  }

  async getProductBySlug(slug: string): Promise<ProductDetailItem> {
    const prodRes = await this.db
      .select({
        id: products.id,
        slug: products.slug,
        nameBn: products.nameBn,
        aliases: products.aliases,
        image: products.image,
        needsReview: products.needsReview,
        categoryId: categories.id,
        categorySlug: categories.slug,
        categoryNameBn: categories.nameBn,
        unitId: units.id,
        unitCode: units.code,
        unitLabelBn: units.labelBn,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(units, eq(products.unitId, units.id))
      .where(and(eq(products.slug, slug), isNull(products.archivedAt)))
      .limit(1);

    const [prod] = prodRes;
    if (!prod) {
      throw new NotFoundException(`Product not found: ${slug}`);
    }

    // Latest published report
    const [report] = await this.db
      .select()
      .from(reports)
      .where(eq(reports.status, 'published'))
      .orderBy(desc(reports.date))
      .limit(1);

    if (!report || !report.currentRevisionId) {
      throw new NotFoundException('No published price data available');
    }

    // Current price entry
    const entryRes = await this.db
      .select()
      .from(priceEntries)
      .where(and(eq(priceEntries.revisionId, report.currentRevisionId), eq(priceEntries.productId, prod.id)))
      .limit(1);
    const entry = entryRes[0];

    // Previous report
    const [prevReport] = await this.db
      .select({ id: reports.id, date: reports.date, currentRevisionId: reports.currentRevisionId })
      .from(reports)
      .where(and(eq(reports.status, 'published'), lt(reports.date, report.date)))
      .orderBy(desc(reports.date))
      .limit(1);

    let prevMin: number | null = null;
    let prevMax: number | null = null;
    let prevMid: number | null = null;

    if (prevReport?.currentRevisionId) {
      const [prevEntry] = await this.db
        .select()
        .from(priceEntries)
        .where(and(eq(priceEntries.revisionId, prevReport.currentRevisionId), eq(priceEntries.productId, prod.id)))
        .limit(1);
      if (prevEntry) {
        prevMin = prevEntry.min;
        prevMax = prevEntry.max;
        prevMid = mid(prevMin, prevMax);
      }
    }

    const curMin = entry?.min ?? null;
    const curMax = entry?.max ?? null;
    const curMid = mid(curMin, curMax);
    const pct = changePct(curMid, prevMid);
    const roundedPct = pct !== null ? roundPct(pct) : null;
    const dir = direction(pct);
    const changeAmount = curMid !== null && prevMid !== null ? curMid - prevMid : null;

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

    const context = {
      today: {
        min: curMin,
        max: curMax,
        mid: curMid,
        date: report.date,
      },
      weekAgo: {
        min: entry?.weekAgoMin ?? null,
        max: entry?.weekAgoMax ?? null,
        mid: mid(entry?.weekAgoMin ?? null, entry?.weekAgoMax ?? null),
        date: compareDates.week,
      },
      monthAgo: {
        min: entry?.monthAgoMin ?? null,
        max: entry?.monthAgoMax ?? null,
        mid: mid(entry?.monthAgoMin ?? null, entry?.monthAgoMax ?? null),
        date: compareDates.month,
      },
      yearAgo: {
        min: entry?.yearAgoMin ?? null,
        max: entry?.yearAgoMax ?? null,
        mid: mid(entry?.yearAgoMin ?? null, entry?.yearAgoMax ?? null),
        date: compareDates.year,
      },
    };

    // 7-day sparkline
    const recentReports = await this.db
      .select({ id: reports.id, date: reports.date, revisionId: reports.currentRevisionId })
      .from(reports)
      .where(and(eq(reports.status, 'published'), sql`${reports.date} <= ${report.date}`))
      .orderBy(desc(reports.date))
      .limit(7);

    const revIds = recentReports.map((r) => r.revisionId).filter((id): id is number => id !== null);
    const sparkline: Array<{ date: string; mid: number | null }> = [];
    if (revIds.length > 0) {
      const sparkRows = await this.db
        .select({
          revisionId: priceEntries.revisionId,
          min: priceEntries.min,
          max: priceEntries.max,
        })
        .from(priceEntries)
        .where(and(eq(priceEntries.productId, prod.id), inArray(priceEntries.revisionId, revIds)));

      const revDateMap = new Map<number, string>();
      for (const r of recentReports) {
        if (r.revisionId) revDateMap.set(r.revisionId, r.date);
      }
      for (const row of sparkRows) {
        const d = revDateMap.get(row.revisionId);
        if (d) {
          sparkline.push({ date: d, mid: mid(row.min, row.max) });
        }
      }
      sparkline.sort((a, b) => a.date.localeCompare(b.date));
    }

    let parsedAliases: string[] = [];
    try {
      parsedAliases = JSON.parse(prod.aliases || '[]');
    } catch {
      parsedAliases = [];
    }

    return {
      id: prod.id,
      slug: prod.slug,
      nameBn: prod.nameBn,
      image: prod.image,
      aliases: parsedAliases,
      needsReview: prod.needsReview,
      category: {
        id: prod.categoryId,
        slug: prod.categorySlug,
        nameBn: prod.categoryNameBn,
      },
      unit: {
        id: prod.unitId,
        code: prod.unitCode,
        labelBn: prod.unitLabelBn,
      },
      currentPrice: {
        min: curMin,
        max: curMax,
        mid: curMid,
        prevMin,
        prevMax,
        prevMid,
        changeAmount,
        changePct: roundedPct,
        direction: dir,
        lastChangedOn: entry?.lastChangedOn ?? null,
        reportDate: report.date,
      },
      context,
      sparkline,
    };
  }

  async getProductHistory(slug: string, range = '30d'): Promise<HistoryPoint[]> {
    const [prod] = await this.db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.slug, slug), isNull(products.archivedAt)))
      .limit(1);

    if (!prod) {
      throw new NotFoundException(`Product not found: ${slug}`);
    }
    const productId = prod.id;

    const startDate = this.computeStartDate(range);

    const rows = await this.db
      .select({
        date: reports.date,
        min: priceEntries.min,
        max: priceEntries.max,
      })
      .from(reports)
      .innerJoin(priceEntries, eq(reports.currentRevisionId, priceEntries.revisionId))
      .where(
        and(
          eq(reports.status, 'published'),
          eq(priceEntries.productId, productId),
          startDate ? sql`${reports.date} >= ${startDate}` : sql`1=1`,
        ),
      )
      .orderBy(asc(reports.date));

    const result: HistoryPoint[] = [];
    let prevMid: number | null = null;

    for (const r of rows) {
      const curMid = mid(r.min, r.max);
      const pct = changePct(curMid, prevMid);
      const dir = direction(pct);

      result.push({
        date: r.date,
        min: r.min,
        max: r.max,
        mid: curMid,
        changePct: pct !== null ? roundPct(pct) : null,
        direction: dir,
      });

      prevMid = curMid;
    }

    return result;
  }

  async compareProducts(slugs: string[], range = '30d'): Promise<CompareResult> {
    if (!slugs || slugs.length === 0) {
      throw new BadRequestException('At least one product slug must be provided');
    }
    if (slugs.length > 4) {
      throw new BadRequestException('At most 4 products can be compared simultaneously');
    }

    // Fetch all products
    const prods = await this.db
      .select({
        id: products.id,
        slug: products.slug,
        nameBn: products.nameBn,
        categoryId: categories.id,
        categorySlug: categories.slug,
        categoryNameBn: categories.nameBn,
        unitId: units.id,
        unitCode: units.code,
        unitLabelBn: units.labelBn,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(units, eq(products.unitId, units.id))
      .where(and(inArray(products.slug, slugs), isNull(products.archivedAt)));

    if (prods.length !== slugs.length) {
      const foundSlugs = new Set(prods.map((p) => p.slug));
      const missing = slugs.filter((s) => !foundSlugs.has(s));
      throw new NotFoundException(`Products not found: ${missing.join(', ')}`);
    }

    const firstProd = prods[0];
    if (!firstProd) {
      throw new BadRequestException('At least one product must be specified');
    }
    const sameUnit = prods.every((p) => p.unitId === firstProd.unitId);
    const startDate = this.computeStartDate(range);
    const prodIds = prods.map((p) => p.id);

    // Fetch historical prices for all requested products
    const rows = await this.db
      .select({
        date: reports.date,
        productId: priceEntries.productId,
        min: priceEntries.min,
        max: priceEntries.max,
      })
      .from(reports)
      .innerJoin(priceEntries, eq(reports.currentRevisionId, priceEntries.revisionId))
      .where(
        and(
          eq(reports.status, 'published'),
          inArray(priceEntries.productId, prodIds),
          startDate ? sql`${reports.date} >= ${startDate}` : sql`1=1`,
        ),
      )
      .orderBy(asc(reports.date));

    // Map: productId -> Array<{ date, mid }>
    const prodHistory = new Map<number, Array<{ date: string; mid: number | null }>>();
    const allDates = new Set<string>();

    for (const r of rows) {
      allDates.add(r.date);
      const list = prodHistory.get(r.productId) || [];
      list.push({ date: r.date, mid: mid(r.min, r.max) });
      prodHistory.set(r.productId, list);
    }

    // Determine baseline mid at start for rebasing
    const baseMidMap = new Map<number, number>();
    for (const p of prods) {
      const history = prodHistory.get(p.id) || [];
      const firstValid = history.find((h) => h.mid !== null && h.mid > 0);
      if (firstValid && firstValid.mid) {
        baseMidMap.set(p.id, firstValid.mid);
      }
    }

    // Build product headers
    const prodHeaders = prods.map((p) => {
      const hist = prodHistory.get(p.id) || [];
      const latest = hist[hist.length - 1];
      return {
        id: p.id,
        slug: p.slug,
        nameBn: p.nameBn,
        unit: { id: p.unitId, code: p.unitCode, labelBn: p.unitLabelBn },
        category: { id: p.categoryId, slug: p.categorySlug, nameBn: p.categoryNameBn },
        currentPrice: {
          min: null,
          max: null,
          mid: latest?.mid ?? null,
        },
      };
    });

    const sortedDates = Array.from(allDates).sort();
    const series: CompareResult['series'] = [];

    for (const d of sortedDates) {
      const values: Record<string, { price: number | null; rebased: number | null }> = {};

      for (const p of prods) {
        const h = prodHistory.get(p.id)?.find((item) => item.date === d);
        const price = h?.mid ?? null;
        const base = baseMidMap.get(p.id);

        let rebased: number | null = null;
        if (price !== null && base !== undefined && base > 0) {
          rebased = roundPct((price / base) * 100);
        }

        values[p.slug] = { price, rebased };
      }

      series.push({ date: d, values });
    }

    return {
      sameUnit,
      unit: sameUnit ? { id: firstProd.unitId, code: firstProd.unitCode, labelBn: firstProd.unitLabelBn } : null,
      products: prodHeaders,
      series,
    };
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
