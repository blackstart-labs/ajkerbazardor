/**
 * Name normaliser — produces a stable `nameKey` from a raw TCB product name.
 *
 * Rules (applied in order):
 * 1. Bangla digits → Latin (০→0 … ৯→9) so comparisons are digit-agnostic.
 * 2. Fold known spelling variants before any stripping.
 * 3. Strip punctuation noise: ঃ, :, ।, (, ), [, ], and leading/trailing spaces.
 * 4. Collapse multiple spaces to one.
 * 5. Normalise unit suffixes: প্যাঃ → প্যাকেট.
 * 6. Lower-case the result (Latin chars only; Bangla has no case).
 *
 * Same input always gives the same output — this is a pure function.
 */

// Spelling variants that appear across bulletins, keyed by the canonical form.
const SPELLING_VARIANTS: [RegExp, string][] = [
  [/মশুর/g, 'মসুর'],
  [/রশুন/g, 'রসুন'],
  [/ডিম\s*\(মুরগী\)/g, 'ডিম (মুরগি)'],
  [/ময়দা\s*প্যাঃ/g, 'ময়দা প্যাকেট'],
  [/আটা\s*প্যাঃ/g, 'আটা প্যাকেট'],
];

// Bangla digit to Latin digit map.
const BANGLA_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

function replaceBanglaDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => BANGLA_DIGITS[d] ?? d);
}

/**
 * Normalise a raw TCB product name to a stable key.
 * Identity = normalised name + unit (callers concatenate them with a separator).
 */
export function normaliseName(raw: string): string {
  let s = raw.trim();

  // 1. Bangla digits → Latin
  s = replaceBanglaDigits(s);

  // 2. Fold spelling variants
  for (const [pattern, canonical] of SPELLING_VARIANTS) {
    s = s.replace(pattern, canonical);
  }

  // 3. Strip punctuation noise
  s = s.replace(/[ঃ:।()[\]]/g, ' ');

  // 4. Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  // 5. Normalise unit suffix shorthands
  s = s.replace(/প্যাঃ/g, 'প্যাকেট');

  // 6. Lower-case (only affects any Latin chars mixed in)
  s = s.toLowerCase();

  return s;
}

/**
 * Normalise a unit label from TCB columns to a stable unit code.
 * The unit code is what's stored in the Unit table.
 */
const UNIT_NORMALISATIONS: [RegExp, string][] = [
  [/প্রতি\s*কেজি\s*প্যাঃ/g, 'কেজি-প্যাকেট'],
  [/প্রতি\s*কেজি/g, 'কেজি'],
  [/প্রতি\s*1\s*লিটার/g, '১-লিটার'],
  [/প্রতি\s*2\s*লিটার/g, '২-লিটার'],
  [/প্রতি\s*5\s*লিটার/g, '৫-লিটার'],
  [/প্রতি\s*লিটার/g, 'লিটার'],
  [/প্রতি\s*হালি/g, 'হালি'],
  [/প্রতি\s*দিস্তা/g, 'দিস্তা'],
  [/প্রতি\s*মেঃ\s*টন/g, 'মেট্রিক-টন'],
  [/প্রতি\s*1\s*কেজি/g, '১-কেজি'],
];

export function normaliseUnit(raw: string): string {
  // Convert Bangla digits first so patterns can match Latin digits only
  let s = replaceBanglaDigits(raw.trim());

  for (const [pattern, code] of UNIT_NORMALISATIONS) {
    s = s.replace(pattern, code);
  }

  // Collapse any remaining whitespace and strip trailing noise
  s = s.replace(/\s+/g, ' ').trim().toLowerCase();

  return s;
}

/**
 * Produce the composite key used for product identity matching.
 * Format: `<normalisedName>|<normalisedUnit>`
 */
export function productKey(rawName: string, rawUnit: string): string {
  return `${normaliseName(rawName)}|${normaliseUnit(rawUnit)}`;
}

/**
 * Normalise a TCB group header to a stable key used in the GroupMap table.
 * Strips punctuation, leading spaces, and known variants.
 */
export function normaliseGroup(raw: string): string {
  let s = raw.trim();
  // Strip leading/trailing punctuation and spaces used inconsistently
  s = s.replace(/^[\s:ঃ।]+|[\s:ঃ।]+$/g, '');
  s = s.replace(/\s+/g, ' ');
  return s;
}
