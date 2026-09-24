import type { Direction } from './types.js';

export const DIRECTION_THRESHOLD_PCT = 0.5;

/**
 * Midpoint of a min/max price range.
 * Returns null if either value is null — null means "no data", not free.
 */
export function mid(min: number | null, max: number | null): number | null {
  if (min === null || max === null) return null;
  return (min + max) / 2;
}

/**
 * Percentage change from a previous midpoint to the current midpoint.
 * Returns null if either is null or if prevMid is zero (avoids divide-by-zero).
 * Matches TCB's own formula: (midNow - midPrev) / midPrev × 100.
 */
export function changePct(midNow: number | null, midPrev: number | null): number | null {
  if (midNow === null || midPrev === null || midPrev === 0) return null;
  return ((midNow - midPrev) / midPrev) * 100;
}

/**
 * Direction of price movement.
 * ±0.5% dead zone prevents "up" / "down" from noise in unchanged prices.
 */
export function direction(pct: number | null): Direction | null {
  if (pct === null) return null;
  if (pct > DIRECTION_THRESHOLD_PCT) return 'up';
  if (pct < -DIRECTION_THRESHOLD_PCT) return 'down';
  return 'same';
}

/**
 * Round a change percentage to 1 decimal place for display.
 * Uses sign-preserving rounding: -3.05 → -3.1, not -3.
 */
export function roundPct(pct: number): number {
  const sign = pct < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(pct) * 10)) / 10;
}

/**
 * Verify that our computed percentage matches the sheet's reported value
 * within 0.1 percentage points. Used as a sanity check during import.
 */
export function pctWithinTolerance(computed: number, reported: number, tolerancePpt = 0.1): boolean {
  return Math.abs(computed - reported) <= tolerancePpt;
}
