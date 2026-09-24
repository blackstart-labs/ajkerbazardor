import { Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { normaliseName, normaliseUnit, type ImportWarning } from '@ajkerbazardor/shared';

const BN_DIGITS: Record<string, string> = {
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

function bnToEnDigits(str: string): string {
  if (!str) return '';
  return str.replace(/[০-৯]/g, (d) => BN_DIGITS[d] || d);
}

function excelDateToIso(serial: unknown): string | null {
  if (typeof serial !== 'number' || !serial) return null;
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().slice(0, 10);
}

export interface ParsedProductItem {
  group: string;
  nameBn: string;
  nameKey: string;
  unitBn: string;
  unitCode: string;
  min: number | null;
  max: number | null;
  weekAgoMin: number | null;
  weekAgoMax: number | null;
  monthAgoMin: number | null;
  monthAgoMax: number | null;
  yearAgoMin: number | null;
  yearAgoMax: number | null;
  lastChangedOn: string | null;
}

export interface ParsedTcbReport {
  serialNo: number | null;
  date: string;
  memoNo: string | null;
  markets: string[];
  compareDates: {
    today: string | null;
    week: string | null;
    month: string | null;
    year: string | null;
  };
  products: ParsedProductItem[];
  warnings: ImportWarning[];
}

@Injectable()
export class TcbParserService {
  parse(buffer: Buffer): ParsedTcbReport {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = wb.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel workbook contains no sheets');
    }

    const sheet = wb.Sheets[firstSheetName];
    if (!sheet) {
      throw new Error('Failed to load first sheet from workbook');
    }

    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const warnings: ImportWarning[] = [];

    // 1. Serial No
    const row2 = String(rows[2]?.[0] || '');
    const serialMatch = row2.match(/সিরিয়াল\s*নং[ঃ:]\s*([০-৯\d]+)/);
    const serialNo = serialMatch?.[1] ? Number.parseInt(bnToEnDigits(serialMatch[1]), 10) : null;

    // 2. Date & Memo
    const row4 = String(rows[4]?.[0] || '');
    const memoMatch = row4.match(/নং-([^\s]+)/);
    const memoNo = memoMatch ? memoMatch[0] : null;

    const dateMatch = row4.match(/তারিখ[ঃ:]\s*([০-৯\d]{1,2}-[০-৯\d]{1,2}-[০-৯\d]{4})/);
    let date = '';
    if (dateMatch?.[1]) {
      const parts = bnToEnDigits(dateMatch[1]).split('-');
      if (parts.length === 3 && parts[2] && parts[1] && parts[0]) {
        date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // 3. Compare Dates from row 6
    const row6 = (rows[6] || []) as (number | null)[];
    const compareDates = {
      today: excelDateToIso(row6[2]),
      week: excelDateToIso(row6[4]),
      month: excelDateToIso(row6[6]),
      year: excelDateToIso(row6[9]),
    };

    if (!date && compareDates.today) {
      date = compareDates.today;
    }

    if (!date) {
      throw new Error('Could not determine bulletin date from Excel header');
    }

    // 4. Find Markets and Changed Items block
    let markets: string[] = [];
    let changedBlockStart = -1;

    for (let i = 75; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const cell0 = String(r[0] || '').trim();
      if (cell0.includes('যে সকল বাজার হতে')) {
        const marketText = String(r[2] || r[1] || '')
          .trim()
          .replace(/[।.]+$/, '');
        markets = marketText
          .split(/[,、\n]/)
          .map((m) => m.trim())
          .filter((m) => m.length > 0);
      }
      if (cell0.includes('যে সকল পণ্যের মূল্য হ্রাস/বৃদ্ধি হয়েছে')) {
        changedBlockStart = i + 2;
      }
    }

    // 5. Parse changed block for last_changed_on dates
    const changedDates = new Map<string, string>();
    if (changedBlockStart > 0) {
      for (let i = changedBlockStart; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[0] || r.length < 3) break;
        const prodName = String(r[0]).trim();
        const note = String(r[7] || '');
        const noteDateMatch = note.match(/([০-৯\d]{1,2}-[০-৯\d]{1,2}-[০-৯\d]{4})/);
        if (noteDateMatch?.[1]) {
          const parts = bnToEnDigits(noteDateMatch[1]).split('-');
          if (parts.length === 3 && parts[2] && parts[1] && parts[0]) {
            const changedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            changedDates.set(normaliseName(prodName), changedDate);
          }
        }
      }
    }

    // 6. Parse products
    let currentGroup = 'চাল';
    const products: ParsedProductItem[] = [];

    for (let i = 8; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      const col0 = String(r[0]).trim();

      if (col0.includes('যে সকল বাজার হতে')) break;
      if (col0.includes('পণ্যের নাম')) continue;

      const col1 = r[1] !== null && r[1] !== undefined ? String(r[1]).trim() : '';
      const col2 = r[2] !== null && r[2] !== undefined ? String(r[2]).trim() : '';
      const isGroupHeader = col1 === '' && (col2 === '' || col2 === 'সর্বনিম্ন');

      if (isGroupHeader) {
        let g = col0.replace(/[ঃ:]/g, '').trim();
        if (g.includes('গুড়া দুধ')) g = 'গুঁড়া দুধ';
        currentGroup = g;
        continue;
      }

      const nameBn = col0;
      const nameKey = normaliseName(nameBn);
      const unitBn = col1;
      const unitCode = normaliseUnit(unitBn);

      const parsePrice = (val: unknown): number | null => {
        if (typeof val === 'number') return val === 0 ? null : Math.round(val);
        if (!val) return null;
        const parsed = Number.parseInt(bnToEnDigits(String(val).trim()), 10);
        return Number.isNaN(parsed) || parsed === 0 ? null : parsed;
      };

      const min = parsePrice(r[2]);
      const max = parsePrice(r[3]);
      const weekAgoMin = parsePrice(r[4]);
      const weekAgoMax = parsePrice(r[5]);
      const monthAgoMin = parsePrice(r[6]);
      const monthAgoMax = parsePrice(r[7]);
      const yearAgoMin = parsePrice(r[9]);
      const yearAgoMax = parsePrice(r[10]);

      if (min !== null && max !== null && min > max) {
        warnings.push({
          code: 'MIN_EXCEEDS_MAX',
          message: `${nameBn}: সর্বনিম্ন মূল্য (${min}) সর্ব্বোচ্চ মূল্যের (${max}) চেয়ে বেশি`,
          productName: nameBn,
        });
      }

      const lastChangedOn = changedDates.get(nameKey) || null;

      products.push({
        group: currentGroup,
        nameBn,
        nameKey,
        unitBn,
        unitCode,
        min,
        max,
        weekAgoMin,
        weekAgoMax,
        monthAgoMin,
        monthAgoMax,
        yearAgoMin,
        yearAgoMax,
        lastChangedOn,
      });
    }

    if (products.length < 50) {
      warnings.push({
        code: 'LOW_PRODUCT_COUNT',
        message: `প্রত্যাশিত ৬০টির চেয়ে কম পণ্য পাওয়া গেছে (${products.length}টি)`,
      });
    }

    return {
      serialNo,
      date,
      memoNo,
      markets,
      compareDates,
      products,
      warnings,
    };
  }
}
