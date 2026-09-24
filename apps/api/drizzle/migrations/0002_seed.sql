-- Seed: categories and group map
-- Run after 0001_initial.sql

-- ── Categories ────────────────────────────────────────────────────────────────
-- Ordered by rough shopping-trip priority (staples first)
INSERT OR IGNORE INTO category (slug, name_bn, sort_order) VALUES
  ('chal',        'চাল',          1),
  ('ata-moyda',   'আটা ও ময়দা',  2),
  ('tel',         'ভোজ্য তেল',   3),
  ('dal',         'ডাল',          4),
  ('sobji',       'সবজি',         5),
  ('masala',      'মসলা',         6),
  ('mach-gosht',  'মাছ ও গোশত',  7),
  ('dudh',        'গুঁড়া দুধ',   8),
  ('bibidh',      'বিবিধ',        9);

-- ── Units ─────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO unit (code, label_bn) VALUES
  ('কেজি',         'প্রতি কেজি'),
  ('কেজি-প্যাকেট', 'প্রতি কেজি (প্যাকেট)'),
  ('লিটার',        'প্রতি লিটার'),
  ('১-লিটার',      'প্রতি ১ লিটার'),
  ('২-লিটার',      'প্রতি ২ লিটার'),
  ('৫-লিটার',      'প্রতি ৫ লিটার'),
  ('হালি',         'প্রতি হালি'),
  ('দিস্তা',       'প্রতি দিস্তা'),
  ('মেট্রিক-টন',  'প্রতি মেট্রিক টন'),
  ('১-কেজি',       'প্রতি ১ কেজি');

-- ── Group Map ─────────────────────────────────────────────────────────────────
-- Maps normalised TCB group header text → our category.
-- TCB's groups are inconsistently punctuated; keys here are already normalised.
-- The "চাল" group has no explicit header — rows before the first header get it.
INSERT OR IGNORE INTO group_map (source_group_key, category_id) VALUES
  ('চাল',          (SELECT id FROM category WHERE slug = 'chal')),
  ('আটা/ময়দা',    (SELECT id FROM category WHERE slug = 'ata-moyda')),
  ('ভোজ্য তেল',   (SELECT id FROM category WHERE slug = 'tel')),
  ('ডাল',          (SELECT id FROM category WHERE slug = 'dal')),
  ('মসলা',         (SELECT id FROM category WHERE slug = 'masala')),
  ('মাছ ও গোশত',  (SELECT id FROM category WHERE slug = 'mach-gosht')),
  ('গুঁড়া দুধ',   (SELECT id FROM category WHERE slug = 'dudh')),
  ('বিবিধ',        (SELECT id FROM category WHERE slug = 'bibidh'));

-- ── Product overrides: reclassify vegetables from TCB's odd groupings ─────────
-- Potato (আলু) is in TCB's ডাল group; onion/chilli/brinjal in মসলা; eggs/veg in বিবিধ.
-- The group_map above covers the default; individual product categories are set
-- on the product row by the importer using the override table below.
CREATE TABLE IF NOT EXISTS product_category_override (
  name_key    TEXT NOT NULL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES category(id)
);

INSERT OR IGNORE INTO product_category_override (name_key, category_id) VALUES
  -- Potato, onion, green chilli, brinjal, cucumber, lemon → সবজি
  ('আলু',          (SELECT id FROM category WHERE slug = 'sobji')),
  ('পেঁয়াজ',      (SELECT id FROM category WHERE slug = 'sobji')),
  ('কাঁচা মরিচ',  (SELECT id FROM category WHERE slug = 'sobji')),
  ('বেগুন',        (SELECT id FROM category WHERE slug = 'sobji')),
  ('শশা',          (SELECT id FROM category WHERE slug = 'sobji')),
  ('লেবু',         (SELECT id FROM category WHERE slug = 'sobji'));
