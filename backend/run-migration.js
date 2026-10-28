const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:yagya@localhost:5432/dymgcxar_AI_police_v2'
  });

  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migration.sql'),
      'utf8'
    );

    console.log('Running migration...');
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
