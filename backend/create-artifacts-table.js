const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:yagya@localhost:5432/dymgcxar_AI_police_v2'
});

async function createTables() {
  try {
    console.log('Reading migration file...');
    const sql = fs.readFileSync('migration-risk-template.sql', 'utf8');
    
    console.log('Executing migration...');
    await pool.query(sql);
    
    console.log('✅ Migration complete!');
    
    // Check artifacts table
    const result = await pool.query('SELECT COUNT(*) as count FROM artifacts');
    console.log(`Artifacts in table: ${result.rows[0].count}`);
    
    // Check generated_documents table
    const result2 = await pool.query('SELECT COUNT(*) as count FROM generated_documents');
    console.log(`Generated documents in table: ${result2.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTables();
