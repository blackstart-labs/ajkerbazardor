/**
 * Bangla number, date, and currency formatters.
 *
 * All formatters use Intl so they pick up the browser/Node locale data.
 * We don't ship a custom Bangla locale — the bn-BD CLDR data is in V8.
 */

const BN_BD = 'bn-BD';
const BENG_SYSTEM = { numberingSystem: 'beng' } as const;

// Reuse formatter instances — Intl construction is expensive.
const takaFormatter = new Intl.NumberFormat(BN_BD, {
  ...BENG_SYSTEM,
  style: 'currency',
  currency: 'BDT',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat(BN_BD, {
  ...BENG_SYSTEM,
  notation: 'compact',
  maximumFractionDigits: 1,
});

const decimalFormatter = new Intl.NumberFormat(BN_BD, {
  ...BENG_SYSTEM,
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const plainNumberFormatter = new Intl.NumberFormat(BN_BD, {
  ...BENG_SYSTEM,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format taka as ৳১,২৪০ (Bangla digits, lakh grouping from bn-BD locale).
 * Null → "—" (em dash).
 */
export function formatTaka(taka: number | null): string {
  if (taka === null) return '—';
  return takaFormatter.format(taka);
}

/**
 * Format a price range as ৳১২০ – ৳১৪০.
 */
export function formatPriceRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—';
  if (min === null) return formatTaka(max);
  if (max === null) return formatTaka(min);
  if (min === max) return formatTaka(min);
  return `${formatTaka(min)} – ${formatTaka(max)}`;
}

/**
 * Format a change percentage with sign, 1 decimal, Bangla digits.
 * E.g. +৪.২% or −৩.১%. Null → "—".
 */
export function formatChangePct(pct: number | null): string {
  if (pct === null) return '—';
  const sign = pct > 0 ? '+' : '';
  const formatted = decimalFormatter.format(Math.abs(pct));
  return `${sign === '+' ? '+' : '−'}${formatted}%`;
}

/**
 * Format a taka delta with sign: +৳৫ or −৳৩.
 */
export function formatTakaDelta(delta: number | null): string {
  if (delta === null) return '—';
  const sign = delta >= 0 ? '+' : '−';
  return `${sign}${formatTaka(Math.abs(delta))}`;
}

/**
 * Compact number for large values: ১.২ লাখ, ৩ হাজার.
 */
export function formatCompact(n: number): string {
  return compactNumberFormatter.format(n);
}

/**
 * Plain Bangla integer: ৬০.
 */
export function formatBnInt(n: number): string {
  return plainNumberFormatter.format(n);
}

// ── Date formatting ───────────────────────────────────────────────────────────

const BANGLA_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

const BANGLA_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

const BANGLA_DAY_SHORT = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

const timeFormatter = new Intl.DateTimeFormat(BN_BD, {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  numberingSystem: 'beng',
  timeZone: 'Asia/Dhaka',
});

/**
 * Format a YYYY-MM-DD string as "২৪ সেপ্টেম্বর ২০২৬".
 */
export function formatBnDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const dayBn = plainNumberFormatter.format(day);
  const monthBn = BANGLA_MONTHS[(month - 1) % 12] ?? '';
  const yearBn = plainNumberFormatter.format(year);
  return `${dayBn} ${monthBn} ${yearBn}`;
}

/**
 * Format a YYYY-MM-DD string as "বৃহস্পতিবার, ২৪ সেপ্টেম্বর".
 */
export function formatBnDateWithDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00+06:00`);
  const dayOfWeek = BANGLA_DAYS[date.getDay()] ?? '';
  const [, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const dayBn = plainNumberFormatter.format(day);
  const monthBn = BANGLA_MONTHS[(month - 1) % 12] ?? '';
  return `${dayOfWeek}, ${dayBn} ${monthBn}`;
}

/**
 * "Last updated" line: "Last updated: আজ সন্ধ্যা ৭:৫৪".
 * Uses the system clock; call from client side for accuracy.
 */
export function formatLastUpdated(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const time = timeFormatter.format(date);
  return `Last updated: ${time}`;
}

/**
 * Relative date label for change comparisons.
 * "গত সপ্তাহ" / "গত মাস" / "গত বছর" / "২০ সেপ্টেম্বর".
 */
export function formatRelativePeriod(prevDate: string, currentDate: string): string {
  const diffDays = Math.round((new Date(currentDate).getTime() - new Date(prevDate).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 8) return 'গত সপ্তাহ';
  if (diffDays <= 35) return 'গত মাস';
  if (diffDays >= 340) return 'গত বছর';
  return formatBnDate(prevDate);
}

export { BANGLA_MONTHS, BANGLA_DAYS, BANGLA_DAY_SHORT };
