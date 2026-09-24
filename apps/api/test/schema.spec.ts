import { createClient } from '@libsql/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Database Schema & Migrations', () => {
  const dbFile = path.join(__dirname, 'test-schema.db');
  let client: ReturnType<typeof createClient>;

  beforeAll(async () => {
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
    client = createClient({ url: `file:${dbFile}` });

    const migrationsDir = path.join(__dirname, '../drizzle/migrations');
    const files = ['0001_initial.sql', '0002_seed.sql'];

    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const stripped = sql
        .split('\n')
        .map((line) => {
          const idx = line.indexOf('--');
          return idx >= 0 ? line.slice(0, idx) : line;
        })
        .join('\n');

      const statements = stripped
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        await client.execute(stmt);
      }
    }
  });

  afterAll(async () => {
    client.close();
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  it('seeds standard categories', async () => {
    const res = await client.execute('SELECT COUNT(*) as count FROM category');
    expect(Number(res.rows[0]?.[0])).toBe(9);
  });

  it('seeds standard units', async () => {
    const res = await client.execute('SELECT COUNT(*) as count FROM unit');
    expect(Number(res.rows[0]?.[0])).toBe(10);
  });

  it('seeds product category overrides', async () => {
    const res = await client.execute('SELECT COUNT(*) as count FROM product_category_override');
    expect(Number(res.rows[0]?.[0])).toBe(6);
  });

  it('enforces foreign key constraints', async () => {
    await client.execute('PRAGMA foreign_keys = ON');
    await expect(
      client.execute({
        sql: 'INSERT INTO product (slug, name_bn, name_key, category_id, unit_id) VALUES (?, ?, ?, ?, ?)',
        args: ['test-item', 'টেস্ট আইটেম', 'test', 99999, 1],
      }),
    ).rejects.toThrow();
  });

  it('calculates mid-point correctly in current_prices view', async () => {
    // 1. Insert user
    await client.execute({
      sql: 'INSERT INTO user (email, password_hash, role) VALUES (?, ?, ?)',
      args: ['admin@bazardor.test', 'hash', 'admin'],
    });

    // 2. Insert product
    await client.execute({
      sql: 'INSERT INTO product (slug, name_bn, name_key, category_id, unit_id) VALUES (?, ?, ?, 1, 1)',
      args: ['miniket', 'মিনিকেট চাল', 'miniket', 1, 1],
    });

    // 3. Insert report
    await client.execute({
      sql: "INSERT INTO report (id, date, status) VALUES (1, '2026-09-24', 'published')",
    });

    // 4. Insert revision
    await client.execute({
      sql: "INSERT INTO revision (id, report_id, source, created_by) VALUES (1, 1, 'manual', 1)",
    });

    // Link revision to report
    await client.execute({
      sql: 'UPDATE report SET current_revision_id = 1 WHERE id = 1',
    });

    // 5. Insert price entry: min 60, max 70 -> mid should be 65.0
    await client.execute({
      sql: 'INSERT INTO price_entry (revision_id, product_id, min, max) VALUES (1, 1, 60, 70)',
    });

    // 6. Query current_prices view
    const viewRes = await client.execute({
      sql: 'SELECT product_slug, min, max, mid FROM current_prices WHERE product_slug = ?',
      args: ['miniket'],
    });

    expect(viewRes.rows.length).toBe(1);
    expect(viewRes.rows[0]?.['min']).toBe(60);
    expect(viewRes.rows[0]?.['max']).toBe(70);
    expect(viewRes.rows[0]?.['mid']).toBe(65);
  });
});
