/**
 * Direction a price has moved since the previous report.
 * "up" / "down" require the change to exceed 0.5 % to filter noise.
 */
export type Direction = 'up' | 'down' | 'same';

export const DIRECTION_THRESHOLD_PCT = 0.5;

/** Source of a revision — TCB upload or a manual correction. */
export type RevisionSource = 'tcb_import' | 'manual';

/** User roles. */
export type UserRole = 'admin' | 'editor';

/** Report status. */
export type ReportStatus = 'draft' | 'published';

/** Comparison period keys in a bulletin's comparison columns. */
export type ComparePeriod = 'week' | 'month' | 'year';

/** Markets in a TCB bulletin. */
export type Market = 'mirpur6' | 'mohammadpur' | 'newmarket' | 'rampura' | 'mohakhali';

export const MARKETS: Market[] = ['mirpur6', 'mohammadpur', 'newmarket', 'rampura', 'mohakhali'];

export const MARKET_LABELS: Record<Market, string> = {
  mirpur6: 'মিরপুর-৬',
  mohammadpur: 'মোহাম্মদপুর টাউন হল',
  newmarket: 'নিউ মার্কেট',
  rampura: 'রামপুরা',
  mohakhali: 'মহাখালী',
};

/** Price range — all values in taka (integer paisa avoided; TCB quotes whole taka). */
export interface PriceRange {
  min: number;
  max: number;
}

/** A nullable price range — null when TCB reported 0 or left the cell blank. */
export interface NullablePriceRange {
  min: number | null;
  max: number | null;
}

/** Parsed product row from an xlsx importer. */
export interface ParsedPriceRow {
  nameRaw: string;
  nameKey: string;
  unitRaw: string;
  unitCode: string;
  groupRaw: string;
  today: NullablePriceRange;
  weekAgo: NullablePriceRange;
  monthAgo: NullablePriceRange;
  yearAgo: NullablePriceRange;
  /** Populated from the "prices that changed" block below the main table. */
  lastChangedOn: string | null;
}

/** Bulletin metadata parsed from sheet header. */
export interface BulletinMeta {
  date: string; // YYYY-MM-DD
  serialNo: number | null;
  memoNo: string | null;
  markets: Market[];
  /** Dates corresponding to the comparison columns. Null when the serial couldn't be resolved. */
  compareDates: {
    week: string | null;
    month: string | null;
    year: string | null;
  };
}

/** Summary returned after a successful import. */
export interface ImportSummary {
  date: string;
  revisionId: number;
  productsUpdated: number;
  productsNew: number;
  productsUp: number;
  productsDown: number;
  productsSame: number;
  productsMissing: number;
  warnings: ImportWarning[];
}

export interface ImportWarning {
  code: ImportWarningCode;
  message: string;
  productName?: string;
}

export type ImportWarningCode =
  | 'LOW_PRODUCT_COUNT'
  | 'MIN_EXCEEDS_MAX'
  | 'LARGE_CHANGE'
  | 'PCT_MISMATCH'
  | 'MISSING_PRODUCT';

/** A single price point for a product in the public API. */
export interface ProductPrice {
  productId: number;
  date: string;
  min: number | null;
  max: number | null;
  mid: number | null;
  prevDate: string | null;
  prevMid: number | null;
  changePct: number | null;
  direction: Direction | null;
}
