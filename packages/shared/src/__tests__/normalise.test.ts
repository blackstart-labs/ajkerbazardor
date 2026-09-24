import { normaliseName, normaliseUnit, productKey, normaliseGroup } from '../normalise.js';

describe('normaliseName()', () => {
  it('strips leading/trailing whitespace', () => {
    expect(normaliseName('  পেঁয়াজ  ')).toBe('পেঁয়াজ');
  });

  it('converts Bangla digits to Latin', () => {
    // "২ লিটার" → "2 লিটার"
    expect(normaliseName('সয়াবিন তেল ২ লিটার')).toContain('2');
    expect(normaliseName('সয়াবিন তেল ২ লিটার')).not.toContain('২');
  });

  it('folds মশুর → মসুর', () => {
    expect(normaliseName('মশুর ডাল')).toBe('মসুর ডাল');
  });

  it('folds রশুন → রসুন', () => {
    expect(normaliseName('রশুন')).toBe('রসুন');
  });

  it('strips ঃ and :', () => {
    expect(normaliseName('মসলাঃ')).not.toContain('ঃ');
    expect(normaliseName('মাছ ও গোশত:')).not.toContain(':');
  });

  it('collapses multiple spaces to one', () => {
    expect(normaliseName('সয়াবিন  তেল')).toBe('সয়াবিন তেল');
  });

  it('same input → same output (idempotent)', () => {
    const name = 'মসুর ডাল (মোটা)';
    expect(normaliseName(normaliseName(name))).toBe(normaliseName(name));
  });
});

describe('normaliseUnit()', () => {
  it('normalises "প্রতি কেজি" → "কেজি"', () => {
    expect(normaliseUnit('প্রতি কেজি')).toBe('কেজি');
  });

  it('normalises "প্রতি কেজি প্যাঃ" → "কেজি-প্যাকেট"', () => {
    expect(normaliseUnit('প্রতি কেজি প্যাঃ')).toBe('কেজি-প্যাকেট');
  });

  it('normalises Bangla "২ লিটার" unit', () => {
    expect(normaliseUnit('প্রতি ২ লিটার')).toBe('২-লিটার');
  });

  it('normalises "প্রতি হালি" → "হালি"', () => {
    expect(normaliseUnit('প্রতি হালি')).toBe('হালি');
  });

  it('normalises "প্রতি মেঃ টন" → "মেট্রিক-টন"', () => {
    expect(normaliseUnit('প্রতি মেঃ টন')).toBe('মেট্রিক-টন');
  });
});

describe('productKey()', () => {
  it('produces the same key for equivalent names', () => {
    const k1 = productKey('মশুর ডাল', 'প্রতি কেজি');
    const k2 = productKey('মসুর ডাল', 'প্রতি কেজি');
    expect(k1).toBe(k2);
  });

  it('distinguishes soybean oil sizes', () => {
    const k1L = productKey('সয়াবিন তেল (বোতল)', 'প্রতি ১ লিটার');
    const k2L = productKey('সয়াবিন তেল (বোতল)', 'প্রতি ২ লিটার');
    const k5L = productKey('সয়াবিন তেল (বোতল)', 'প্রতি ৫ লিটার');
    expect(k1L).not.toBe(k2L);
    expect(k2L).not.toBe(k5L);
    expect(k1L).not.toBe(k5L);
  });

  it('treats Bangla-digit and Latin-digit names as identical', () => {
    const kBn = productKey('সয়াবিন তেল ২ লিটার', 'প্রতি কেজি');
    const kLatin = productKey('সয়াবিন তেল 2 লিটার', 'প্রতি কেজি');
    expect(kBn).toBe(kLatin);
  });
});

describe('normaliseGroup()', () => {
  it('strips leading space from " ডাল"', () => {
    expect(normaliseGroup(' ডাল')).toBe('ডাল');
  });

  it('strips trailing ঃ from "মসলাঃ"', () => {
    expect(normaliseGroup('মসলাঃ')).toBe('মসলা');
  });

  it('strips trailing : from "মাছ ও গোশত:"', () => {
    expect(normaliseGroup('মাছ ও গোশত:')).toBe('মাছ ও গোশত');
  });
});
