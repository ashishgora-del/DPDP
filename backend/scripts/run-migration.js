#!/usr/bin/env node
/**
 * run-migration.js  –  Applies migration.sql (and any files in scripts/migrations/)
 *                      against the configured DATABASE_URL.
 *
 * Strategy: each SQL statement is executed individually.
 * Statements that produce "already exists" errors are silently skipped so the
 * script can be run safely on an existing database (idempotent re-runs).
 *
 * PostgreSQL error codes ignored:
 *   42P07 – duplicate_table
 *   42710 – duplicate_object  (TYPE, INDEX, CONSTRAINT already exists)
 *   42701 – duplicate_column
 *   42P16 – invalid_table_definition (already has PRIMARY KEY)
 *
 * Usage:
 *   DATABASE_URL=postgres://user:pass@host/db node scripts/run-migration.js
 *   npm run migration:run
 */

const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

// ── helpers ────────────────────────────────────────────────────────────────
const COLORS = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  bright: '\x1b[1m',
};
function log(msg, color = COLORS.reset) { console.log(`${color}${msg}${COLORS.reset}`); }

/** PostgreSQL error codes that mean "this object already exists – skip it" */
const SKIP_CODES = new Set(['42P07', '42710', '42701', '42P16']);

/**
 * Split a multi-statement SQL string into individual statements.
 * Handles:
 *  - single-line  -- comments
 *  - block        /* ... *\/ comments
 *  - dollar-quoted $$ … $$ strings (stored procedures, etc.)
 *  - standard semicolons as statement delimiters
 */
function splitStatements(sql) {
  const statements = [];
  let current = '';
  let i = 0;
  let inBlockComment = false;
  let inLineComment  = false;
  let inDollarQuote  = false;
  let dollarTag      = '';

  while (i < sql.length) {
    const ch  = sql[i];
    const ch2 = sql[i + 1];

    if (inLineComment) {
      current += ch;
      if (ch === '\n') inLineComment = false;
      i++;
      continue;
    }

    if (inBlockComment) {
      current += ch;
      if (ch === '*' && ch2 === '/') { current += ch2; i += 2; inBlockComment = false; }
      else i++;
      continue;
    }

    if (inDollarQuote) {
      current += ch;
      // Look for matching closing dollar tag
      if (ch === '$') {
        const end = sql.indexOf('$', i + 1);
        if (end !== -1) {
          const tag = sql.slice(i, end + 1);
          if (tag === dollarTag) {
            current += sql.slice(i + 1, end + 1);
            i = end + 1;
            inDollarQuote = false;
            continue;
          }
        }
      }
      i++;
      continue;
    }

    // Start of line comment?
    if (ch === '-' && ch2 === '-') { inLineComment = true; current += ch; i++; continue; }

    // Start of block comment?
    if (ch === '/' && ch2 === '*') { inBlockComment = true; current += ch + ch2; i += 2; continue; }

    // Start of dollar-quote?
    if (ch === '$') {
      const end = sql.indexOf('$', i + 1);
      if (end !== -1) {
        const tag = sql.slice(i, end + 1);
        if (/^\$[A-Za-z0-9_]*\$$/.test(tag)) {
          dollarTag     = tag;
          inDollarQuote = true;
          current += tag;
          i = end + 1;
          continue;
        }
      }
    }

    // Statement delimiter?
    if (ch === ';') {
      const stmt = current.trim();
      if (stmt.length > 0) statements.push(stmt);
      current = '';
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  const remaining = current.trim();
  if (remaining.length > 0) statements.push(remaining);

  return statements;
}

// ── collect migration files ────────────────────────────────────────────────
const rootMigration = path.join(__dirname, '..', 'migration.sql');
const migrationsDir = path.join(__dirname, 'migrations');

const files = [];

if (fs.existsSync(rootMigration)) {
  files.push({ label: 'migration.sql (base schema)', file: rootMigration });
}

if (fs.existsSync(migrationsDir)) {
  const extras = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // apply in alphabetical / timestamp order
  for (const f of extras) {
    files.push({ label: f, file: path.join(migrationsDir, f) });
  }
}

if (files.length === 0) {
  log('⚠️  No migration files found. Nothing to do.', COLORS.yellow);
  process.exit(0);
}

// ── connect ────────────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  log('❌  DATABASE_URL environment variable is not set.', COLORS.red);
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ── run ────────────────────────────────────────────────────────────────────
(async () => {
  const client = await pool.connect();

  try {
    for (const { label, file } of files) {
      log(`\n📄  Applying: ${label}`, COLORS.bright + COLORS.cyan);

      const sql = fs.readFileSync(file, 'utf8');
      const statements = splitStatements(sql);

      log(`   Found ${statements.length} statement(s)`, COLORS.cyan);

      let applied = 0;
      let skipped = 0;

      for (const stmt of statements) {
        // Skip pure comment lines (no actual SQL)
        if (/^(--.*)$/m.test(stmt) && !/^(CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|GRANT|REVOKE|DO)/i.test(stmt)) {
          continue;
        }

        try {
          await client.query(stmt);
          applied++;
        } catch (err) {
          if (SKIP_CODES.has(err.code)) {
            skipped++;
          } else {
            log(`\n❌  Statement failed:\n${stmt}\n\nError: ${err.message} (${err.code})`, COLORS.red);
            throw err;
          }
        }
      }

      log(`   ✅  Applied: ${applied}  |  Skipped (already exists): ${skipped}`, COLORS.green);
    }

    log('\n🎉  Migration completed successfully!\n', COLORS.bright + COLORS.green);
  } catch (err) {
    log(`\n❌  Migration failed: ${err.message}`, COLORS.red);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
