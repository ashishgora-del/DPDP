const { Pool } = require('pg');

async function checkDatabase() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:yagya@localhost:5432/dymgcxar_AI_police_v2'
  });

  try {
    console.log('Checking database connection...');
    
    // Check if risk_assessments table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'risk_assessments'
      );
    `);
    
    console.log('risk_assessments table exists:', result.rows[0].exists);
    
    // List all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\nAll tables in database:');
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
