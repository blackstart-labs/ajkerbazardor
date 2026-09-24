import { sqliteTable, text, integer, blob, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ── Category ──────────────────────────────────────────────────────────────────

export const categories = sqliteTable('category', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  nameBn: text('name_bn').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  illustration: text('illustration'),
});

// ── GroupMap ──────────────────────────────────────────────────────────────────
// Maps a normalised TCB group header key → one of our categories.
// Editable by admin so staff can reclassify without a deploy.

export const groupMaps = sqliteTable('group_map', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sourceGroupKey: text('source_group_key').notNull().unique(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
});

// ── Unit ──────────────────────────────────────────────────────────────────────

export const units = sqliteTable('unit', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  labelBn: text('label_bn').notNull(),
});

// ── Product ───────────────────────────────────────────────────────────────────

export const products = sqliteTable(
  'product',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull().unique(),
    nameBn: text('name_bn').notNull(),
    // Normalised name — stable across bulletin spelling drift
    nameKey: text('name_key').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    unitId: integer('unit_id')
      .notNull()
      .references(() => units.id),
    image: text('image'),
    // JSON array of alternate names observed in bulletins
    aliases: text('aliases').notNull().default('[]'),
    needsReview: integer('needs_review', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    archivedAt: text('archived_at'),
  },
  (t) => [uniqueIndex('product_name_key_unit_idx').on(t.nameKey, t.unitId)],
);

// ── Report ────────────────────────────────────────────────────────────────────
// One row per calendar date. Has many revisions; currentRevisionId points to the live one.

export const reports = sqliteTable('report', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  serialNo: integer('serial_no'),
  memoNo: text('memo_no'),
  // JSON: Market[]
  markets: text('markets').notNull().default('[]'),
  // JSON: { week: string|null, month: string|null, year: string|null }
  compareDates: text('compare_dates').notNull().default('{}'),
  currentRevisionId: integer('current_revision_id'),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
});

// ── Revision ──────────────────────────────────────────────────────────────────
// Every import (or manual correction) creates an immutable revision.
// Undo = point report.currentRevisionId back to the previous revision.

export const revisions = sqliteTable('revision', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reportId: integer('report_id')
    .notNull()
    .references(() => reports.id),
  source: text('source', { enum: ['tcb_import', 'manual'] }).notNull(),
  fileName: text('file_name'),
  sha256: text('sha256'),
  // Raw xlsx stored so a parser fix can reprocess without re-upload (~50 KB)
  rawFile: blob('raw_file'),
  // JSON: ImportSummary stats
  stats: text('stats'),
  // JSON: ImportWarning[]
  warnings: text('warnings'),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  supersededAt: text('superseded_at'),
});

// ── PriceEntry ────────────────────────────────────────────────────────────────
// All prices stored as integer taka. Null = no data (0 on the sheet).
// Midpoints are computed at read time, never stored.

export const priceEntries = sqliteTable(
  'price_entry',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    revisionId: integer('revision_id')
      .notNull()
      .references(() => revisions.id),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    min: integer('min'),
    max: integer('max'),
    weekAgoMin: integer('week_ago_min'),
    weekAgoMax: integer('week_ago_max'),
    monthAgoMin: integer('month_ago_min'),
    monthAgoMax: integer('month_ago_max'),
    yearAgoMin: integer('year_ago_min'),
    yearAgoMax: integer('year_ago_max'),
    lastChangedOn: text('last_changed_on'), // YYYY-MM-DD from "prices that changed" block
  },
  (t) => [uniqueIndex('price_entry_rev_prod_idx').on(t.revisionId, t.productId)],
);

// ── AuditLog ──────────────────────────────────────────────────────────────────

export const auditLogs = sqliteTable(
  'audit_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').references(() => users.id),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: integer('entity_id'),
    // JSON diff — what changed
    diff: text('diff'),
    at: text('at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [index('audit_log_at_idx').on(t.at)],
);

// ── User ──────────────────────────────────────────────────────────────────────

export const users = sqliteTable('user', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  // argon2 hash
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['admin', 'editor'] })
    .notNull()
    .default('editor'),
});

// ── Type exports (Drizzle infer) ──────────────────────────────────────────────

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type GroupMap = typeof groupMaps.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Revision = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;
export type PriceEntry = typeof priceEntries.$inferSelect;
export type NewPriceEntry = typeof priceEntries.$inferInsert;
export type User = typeof users.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
