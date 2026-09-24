PRAGMA foreign_keys = ON;

-- ── Category ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS category (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name_bn     TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  illustration TEXT
);

-- ── Group Map ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_map (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  source_group_key TEXT    NOT NULL UNIQUE,
  category_id      INTEGER NOT NULL REFERENCES category(id)
);

-- ── Unit ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS unit (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  code     TEXT NOT NULL UNIQUE,
  label_bn TEXT NOT NULL
);

-- ── User (defined before revision which references it) ────────────────────────
CREATE TABLE IF NOT EXISTS user (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor'))
);

-- ── Product ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name_bn     TEXT    NOT NULL,
  name_key    TEXT    NOT NULL,
  category_id INTEGER NOT NULL REFERENCES category(id),
  unit_id     INTEGER NOT NULL REFERENCES unit(id),
  image       TEXT,
  aliases     TEXT    NOT NULL DEFAULT '[]',
  needs_review INTEGER NOT NULL DEFAULT 0 CHECK (needs_review IN (0, 1)),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  archived_at TEXT,
  UNIQUE (name_key, unit_id)
);

CREATE INDEX IF NOT EXISTS product_name_key_unit_idx ON product (name_key, unit_id);
CREATE INDEX IF NOT EXISTS product_category_idx       ON product (category_id);

-- ── Report ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  date                TEXT    NOT NULL UNIQUE,  -- YYYY-MM-DD
  serial_no           INTEGER,
  memo_no             TEXT,
  markets             TEXT    NOT NULL DEFAULT '[]',   -- JSON
  compare_dates       TEXT    NOT NULL DEFAULT '{}',   -- JSON
  current_revision_id INTEGER,
  status              TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'))
);

-- ── Revision ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revision (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id     INTEGER NOT NULL REFERENCES report(id),
  source        TEXT    NOT NULL CHECK (source IN ('tcb_import', 'manual')),
  file_name     TEXT,
  sha256        TEXT,
  raw_file      BLOB,
  stats         TEXT,    -- JSON
  warnings      TEXT,    -- JSON
  created_by    INTEGER NOT NULL REFERENCES user(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  superseded_at TEXT
);

CREATE INDEX IF NOT EXISTS revision_report_idx ON revision (report_id);
CREATE INDEX IF NOT EXISTS revision_sha256_idx  ON revision (sha256);

-- ── Price Entry ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_entry (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  revision_id   INTEGER NOT NULL REFERENCES revision(id),
  product_id    INTEGER NOT NULL REFERENCES product(id),
  min           INTEGER,
  max           INTEGER,
  week_ago_min  INTEGER,
  week_ago_max  INTEGER,
  month_ago_min INTEGER,
  month_ago_max INTEGER,
  year_ago_min  INTEGER,
  year_ago_max  INTEGER,
  last_changed_on TEXT,  -- YYYY-MM-DD
  UNIQUE (revision_id, product_id)
);

CREATE INDEX IF NOT EXISTS price_entry_product_idx  ON price_entry (product_id);
CREATE INDEX IF NOT EXISTS price_entry_revision_idx ON price_entry (revision_id);

-- ── Audit Log ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER REFERENCES user(id),
  action    TEXT NOT NULL,
  entity    TEXT NOT NULL,
  entity_id INTEGER,
  diff      TEXT,   -- JSON
  at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS audit_log_at_idx ON audit_log (at);

-- ── current_prices view ───────────────────────────────────────────────────────
-- Joins each product to its current revision's price row.
-- Excludes rows where both min and max are NULL (product not sold that day).
-- Used by the public read APIs; window function LAG computes prev price at read time.
CREATE VIEW IF NOT EXISTS current_prices AS
SELECT
  r.date,
  p.id          AS product_id,
  p.slug        AS product_slug,
  p.name_bn     AS product_name_bn,
  p.category_id,
  p.unit_id,
  pe.id         AS price_entry_id,
  pe.min,
  pe.max,
  -- Midpoint: (min+max)/2.0 — REAL division
  CASE WHEN pe.min IS NOT NULL AND pe.max IS NOT NULL
    THEN (pe.min + pe.max) / 2.0
    ELSE NULL
  END AS mid,
  pe.week_ago_min,
  pe.week_ago_max,
  pe.month_ago_min,
  pe.month_ago_max,
  pe.year_ago_min,
  pe.year_ago_max,
  pe.last_changed_on,
  r.compare_dates
FROM report r
JOIN revision rev ON rev.id = r.current_revision_id
JOIN price_entry pe ON pe.revision_id = rev.id
JOIN product p ON p.id = pe.product_id
WHERE r.status = 'published'
  AND (pe.min IS NOT NULL OR pe.max IS NOT NULL);
