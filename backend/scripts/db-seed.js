#!/usr/bin/env node
/**
 * db-seed.js  –  Executes scripts/seed.sql against the configured DATABASE_URL.
 *
 * Usage:
 *   DATABASE_URL=postgres://user:pass@host/db node scripts/db-seed.js
 *   OR:  npm run db:seed
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌  DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const seedFile = path.join(__dirname, 'seed.sql');
if (!fs.existsSync(seedFile)) {
  console.error(`❌  Seed file not found: ${seedFile}`);
  process.exit(1);
}

const sql = fs.readFileSync(seedFile, 'utf8');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('🌱  Running seed script…');
    await client.query(sql);
    console.log('✅  Seed completed successfully!');
    console.log('   Admin:   admin@elearning.com  / Admin@123');
    console.log('   Learner: learner@elearning.com / Learner@123');
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
