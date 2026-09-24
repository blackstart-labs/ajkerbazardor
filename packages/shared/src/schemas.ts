import { z } from 'zod';
import type { Direction, UserRole, ReportStatus, RevisionSource, ImportWarningCode } from './types.js';

// ── Primitives ──────────────────────────────────────────────────────────────

const directionEnum = z.enum(['up', 'down', 'same'] as [Direction, ...Direction[]]);
const userRoleEnum = z.enum(['admin', 'editor'] as [UserRole, ...UserRole[]]);
const reportStatusEnum = z.enum(['draft', 'published'] as [ReportStatus, ...ReportStatus[]]);
const revisionSourceEnum = z.enum(['tcb_import', 'manual'] as [RevisionSource, ...RevisionSource[]]);

// ── API response envelope ────────────────────────────────────────────────────

export const apiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    ok: z.literal(true),
    data: dataSchema,
  });

export const apiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

// ── Category ─────────────────────────────────────────────────────────────────

export const categorySchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).max(80),
  nameBn: z.string().min(1).max(100),
  sortOrder: z.number().int(),
  illustration: z.string().nullable(),
});

export type Category = z.infer<typeof categorySchema>;

export const createCategorySchema = categorySchema.omit({ id: true });
export const updateCategorySchema = createCategorySchema.partial();

// ── Unit ─────────────────────────────────────────────────────────────────────

export const unitSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().min(1).max(30),
  labelBn: z.string().min(1).max(50),
});

export type Unit = z.infer<typeof unitSchema>;

// ── GroupMap ─────────────────────────────────────────────────────────────────

export const groupMapSchema = z.object({
  id: z.number().int().positive(),
  sourceGroupKey: z.string().min(1).max(100),
  categoryId: z.number().int().positive(),
});

export type GroupMap = z.infer<typeof groupMapSchema>;

export const createGroupMapSchema = groupMapSchema.omit({ id: true });
export const updateGroupMapSchema = createGroupMapSchema.partial();

// ── Product ──────────────────────────────────────────────────────────────────

export const productSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).max(120),
  nameBn: z.string().min(1).max(150),
  nameKey: z.string().min(1).max(150),
  categoryId: z.number().int().positive(),
  unitId: z.number().int().positive(),
  image: z.string().nullable(),
  aliases: z.array(z.string()),
  needsReview: z.boolean(),
  sortOrder: z.number().int(),
  archivedAt: z.string().nullable(),
});

export type Product = z.infer<typeof productSchema>;

export const createProductSchema = productSchema.omit({ id: true, nameKey: true, archivedAt: true });
export const updateProductSchema = createProductSchema.partial();

// ── Report ────────────────────────────────────────────────────────────────────

export const reportSchema = z.object({
  id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  serialNo: z.number().int().nullable(),
  memoNo: z.string().nullable(),
  markets: z.array(z.string()),
  compareDates: z.object({
    week: z.string().nullable(),
    month: z.string().nullable(),
    year: z.string().nullable(),
  }),
  currentRevisionId: z.number().int().positive().nullable(),
  status: reportStatusEnum,
});

export type Report = z.infer<typeof reportSchema>;

// ── Revision ──────────────────────────────────────────────────────────────────

export const revisionSchema = z.object({
  id: z.number().int().positive(),
  reportId: z.number().int().positive(),
  source: revisionSourceEnum,
  fileName: z.string().nullable(),
  sha256: z.string().length(64).nullable(),
  stats: z.record(z.unknown()).nullable(),
  warnings: z.array(z.unknown()).nullable(),
  createdBy: z.number().int().positive(),
  createdAt: z.string(),
  supersededAt: z.string().nullable(),
});

export type Revision = z.infer<typeof revisionSchema>;

// ── PriceEntry ────────────────────────────────────────────────────────────────

export const priceEntrySchema = z.object({
  id: z.number().int().positive(),
  revisionId: z.number().int().positive(),
  productId: z.number().int().positive(),
  min: z.number().int().positive().nullable(),
  max: z.number().int().positive().nullable(),
  weekAgoMin: z.number().int().positive().nullable(),
  weekAgoMax: z.number().int().positive().nullable(),
  monthAgoMin: z.number().int().positive().nullable(),
  monthAgoMax: z.number().int().positive().nullable(),
  yearAgoMin: z.number().int().positive().nullable(),
  yearAgoMax: z.number().int().positive().nullable(),
  lastChangedOn: z.string().nullable(),
});

export type PriceEntry = z.infer<typeof priceEntrySchema>;

// ── User ──────────────────────────────────────────────────────────────────────

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  role: userRoleEnum,
});

export type User = z.infer<typeof userSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// ── Import ────────────────────────────────────────────────────────────────────

export const importWarningCodeEnum = z.enum([
  'LOW_PRODUCT_COUNT',
  'MIN_EXCEEDS_MAX',
  'LARGE_CHANGE',
  'PCT_MISMATCH',
  'MISSING_PRODUCT',
] as [ImportWarningCode, ...ImportWarningCode[]]);

export const importWarningSchema = z.object({
  code: importWarningCodeEnum,
  message: z.string(),
  productName: z.string().optional(),
});

export const importSummarySchema = z.object({
  date: z.string(),
  revisionId: z.number().int().positive(),
  productsUpdated: z.number().int(),
  productsNew: z.number().int(),
  productsUp: z.number().int(),
  productsDown: z.number().int(),
  productsSame: z.number().int(),
  productsMissing: z.number().int(),
  warnings: z.array(importWarningSchema),
});

// ── Public API response shapes ────────────────────────────────────────────────

export const productPriceSchema = z.object({
  productId: z.number().int().positive(),
  date: z.string(),
  min: z.number().nullable(),
  max: z.number().nullable(),
  mid: z.number().nullable(),
  prevDate: z.string().nullable(),
  prevMid: z.number().nullable(),
  changePct: z.number().nullable(),
  direction: directionEnum.nullable(),
});

export type ProductPrice = z.infer<typeof productPriceSchema>;

export const dashboardSummarySchema = z.object({
  date: z.string(),
  totalTracked: z.number().int(),
  countUp: z.number().int(),
  countDown: z.number().int(),
  countSame: z.number().int(),
  biggestRiser: z.object({ productSlug: z.string(), nameBn: z.string(), changePct: z.number() }).nullable(),
  biggestFaller: z.object({ productSlug: z.string(), nameBn: z.string(), changePct: z.number() }).nullable(),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

// ── Audit Log ─────────────────────────────────────────────────────────────────

export const auditLogSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive().nullable(),
  action: z.string(),
  entity: z.string(),
  entityId: z.number().int().positive().nullable(),
  diff: z.string().nullable(),
  at: z.string(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

// ── Admin helpers ─────────────────────────────────────────────────────────────

export const reorderCategoriesSchema = z.object({
  orders: z.array(
    z.object({
      id: z.number().int().positive(),
      sortOrder: z.number().int(),
    }),
  ),
});

export type ReorderCategoriesDto = z.infer<typeof reorderCategoriesSchema>;

export const approveProductSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  unitId: z.number().int().positive().optional(),
  nameBn: z.string().min(1).max(150).optional(),
});

export type ApproveProductDto = z.infer<typeof approveProductSchema>;
