/**
 * Migration runner — applies all pending SQL migrations in order.
 * CJS script — runs with: node scripts/migrate.js
 * Or via ts-node: ts-node scripts/migrate.ts
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@libsql/client');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readdir, readFile } = require('node:fs/promises');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('node:path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'drizzle', 'migrations');

async function migrate(): Promise<void> {
  const url = process.env['TURSO_DATABASE_URL'];
  if (!url) throw new Error('TURSO_DATABASE_URL is required');

  const authToken = process.env['TURSO_AUTH_TOKEN'];
  const client = createClient(authToken ? { url, authToken } : { url });

  await client.execute('PRAGMA foreign_keys = ON');

  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const files: string[] = ((await readdir(MIGRATIONS_DIR)) as string[])
    .filter((f: string) => f.endsWith('.sql'))
    .sort();

  let applied = 0;

  for (const file of files) {
    const existing = await client.execute({
      sql: 'SELECT id FROM _migrations WHERE name = ?',
      args: [file],
    });

    if (existing.rows.length > 0) {
      console.warn(`  skip  ${file} (already applied)`);
      continue;
    }

    const sql: string = await readFile(path.join(MIGRATIONS_DIR, file), 'utf-8');

    // Strip -- line comments, then split on semicolons.
    // We can't simply filter statements starting with '--' because multi-line
    // CREATE TABLE statements may have comment lines in the middle.
    const stripped = sql
      .split('\n')
      .map((line: string) => {
        const commentIdx = line.indexOf('--');
        return commentIdx >= 0 ? line.slice(0, commentIdx) : line;
      })
      .join('\n');

    const statements = stripped
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    for (const stmt of statements) {
      await client.execute(stmt);
    }

    await client.execute({
      sql: 'INSERT INTO _migrations (name) VALUES (?)',
      args: [file],
    });

    console.warn(`  apply  ${file}`);
    applied++;
  }

  if (applied === 0) {
    console.warn('No new migrations to apply.');
  } else {
    console.warn(`\nApplied ${applied} migration(s).`);
  }

  client.close();
}

migrate().catch((err: unknown) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
