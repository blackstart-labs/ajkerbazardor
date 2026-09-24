import { mid, changePct, direction, roundPct, pctWithinTolerance } from '../math.js';

describe('mid()', () => {
  it('returns average of min and max', () => {
    expect(mid(100, 200)).toBe(150);
  });

  it('returns same value when min === max', () => {
    expect(mid(500, 500)).toBe(500);
  });

  it('returns null when min is null', () => {
    expect(mid(null, 200)).toBeNull();
  });

  it('returns null when max is null', () => {
    expect(mid(100, null)).toBeNull();
  });

  it('returns null when both are null', () => {
    expect(mid(null, null)).toBeNull();
  });

  it('handles soybean oil 5L: (1000+1000)/2 = 1000', () => {
    expect(mid(1000, 1000)).toBe(1000);
  });

  it('handles soybean oil month-ago: (975+975)/2 = 975', () => {
    expect(mid(975, 975)).toBe(975);
  });
});

describe('changePct()', () => {
  it('computes correct positive change', () => {
    // soybean oil 5L: (1000−975)/975 × 100 = 2.564...%
    const result = changePct(1000, 975);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(2.564, 2);
  });

  it('computes correct negative change', () => {
    const result = changePct(90, 100);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(-10, 4);
  });

  it('returns null when midNow is null', () => {
    expect(changePct(null, 100)).toBeNull();
  });

  it('returns null when midPrev is null', () => {
    expect(changePct(100, null)).toBeNull();
  });

  it('returns null when midPrev is zero (avoids divide-by-zero)', () => {
    expect(changePct(100, 0)).toBeNull();
  });

  it('returns zero change when prices are identical', () => {
    expect(changePct(500, 500)).toBeCloseTo(0, 10);
  });

  it('computes green chilli change: mid(140,160)=150, mid(120,160)=140 → +7.14%', () => {
    // Sept 23 vs Sept 22: min went 120→140
    const prevMid = mid(120, 160); // 140
    const nowMid = mid(140, 160);  // 150
    const pct = changePct(nowMid, prevMid);
    expect(pct).not.toBeNull();
    expect(pct!).toBeCloseTo(7.14, 1);
  });
});

describe('direction()', () => {
  it('returns "up" when pct > 0.5', () => {
    expect(direction(1)).toBe('up');
    expect(direction(0.6)).toBe('up');
    expect(direction(100)).toBe('up');
  });

  it('returns "down" when pct < −0.5', () => {
    expect(direction(-1)).toBe('down');
    expect(direction(-0.6)).toBe('down');
  });

  it('returns "same" in the ±0.5 dead zone', () => {
    expect(direction(0)).toBe('same');
    expect(direction(0.5)).toBe('same');
    expect(direction(-0.5)).toBe('same');
    expect(direction(0.49)).toBe('same');
    expect(direction(-0.49)).toBe('same');
  });

  it('returns null for null input', () => {
    expect(direction(null)).toBeNull();
  });
});

describe('roundPct()', () => {
  it('rounds to 1 decimal', () => {
    expect(roundPct(2.564)).toBe(2.6);
    expect(roundPct(7.142857)).toBe(7.1);
    expect(roundPct(-3.05)).toBe(-3.1);
  });

  it('leaves already-rounded values unchanged', () => {
    expect(roundPct(5.0)).toBe(5);
  });
});

describe('pctWithinTolerance()', () => {
  it('returns true when within 0.1 ppt', () => {
    expect(pctWithinTolerance(2.564, 2.56)).toBe(true);
    expect(pctWithinTolerance(2.564, 2.6)).toBe(true);
  });

  it('returns false when outside 0.1 ppt', () => {
    expect(pctWithinTolerance(2.564, 2.7)).toBe(false);
  });

  it('respects custom tolerance', () => {
    expect(pctWithinTolerance(2.0, 2.5, 0.5)).toBe(true);
    expect(pctWithinTolerance(2.0, 2.6, 0.5)).toBe(false);
  });
});
