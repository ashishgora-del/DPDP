#!/usr/bin/env node
/**
 * create-migration.js  –  Generates a new empty SQL migration file.
 *
 * Creates:  scripts/migrations/YYYYMMDDHHMMSS_<name>.sql
 *
 * Usage:
 *   node scripts/create-migration.js add_index_to_enrollments
 *   npm run migration:create -- add_index_to_enrollments
 *
 * If no name is supplied the file is called <timestamp>_migration.sql
 */

const fs   = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan:  '\x1b[36m',
  red:   '\x1b[31m',
};
function log(msg, color = COLORS.reset) { console.log(`${color}${msg}${COLORS.reset}`); }

// ── timestamp YYYYMMDDHHMMSS ───────────────────────────────────────────────
function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
  ].join('');
}

// ── sanitise name ─────────────────────────────────────────────────────────
const rawName = (process.argv[2] || 'migration')
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

const filename = `${timestamp()}_${rawName}.sql`;
const dir      = path.join(__dirname, 'migrations');
const filepath = path.join(dir, filename);

// ── create directory if needed ────────────────────────────────────────────
fs.mkdirSync(dir, { recursive: true });

// ── write template ────────────────────────────────────────────────────────
const template = `-- Migration: ${rawName}
-- Created:   ${new Date().toISOString()}
-- ---------------------------------------------------------------------------
-- Write your SQL statements below.
-- Each statement must end with a semicolon (;).
-- The migration runner tolerates "already exists" errors (42P07 / 42710 / 42701)
-- so you can re-run this file safely.
-- ---------------------------------------------------------------------------

`;

fs.writeFileSync(filepath, template, 'utf8');

log(`\n✅  Migration file created:\n   ${filepath}\n`, COLORS.green);
log('   Edit the file and run:  npm run migration:run', COLORS.cyan);
