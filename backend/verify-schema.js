const { Pool } = require('pg');

async function verify() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:yagya@localhost:5432/dymgcxar_AI_police_v2'
  });

  try {
    console.log('\n=== DATABASE SCHEMA CHECK ===\n');
    
    // Get table columns
    const schema = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'risk_assessments'
      ORDER BY ordinal_position
    `);
    
    console.log('risk_assessments table columns:');
    schema.rows.forEach(row => {
      console.log(`  ${row.column_name.padEnd(20)} ${row.data_type.padEnd(20)} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    console.log('\n=== BACKEND INSERT STATEMENT CHECK ===\n');
    
    const insertColumns = [
      'id', 'user_id', 'org_name',
      'q1_org_profile', 'q2_geography', 'q3_data_principals', 'q4_large_scale',
      'q5_data_types', 'q6_purposes', 'q7_ai_use', 'q8_vendors',
      'q9_cross_border', 'q10_volume',
      'risk_tier', 'focus_areas', 'sdf_flag', 'risk_drivers', 'template_pack_id',
      'updated_at'
    ];
    
    const paramCount = 18; // $1 to $18
    
    console.log('Backend INSERT columns:');
    insertColumns.forEach((col, i) => {
      const dbCol = schema.rows.find(r => r.column_name === col);
      const status = dbCol ? '✅' : '❌ MISSING';
      console.log(`  ${(i+1).toString().padStart(2)}. $${i+1} → ${col.padEnd(20)} ${status}`);
    });
    
    console.log(`\nTotal parameters: ${paramCount}`);
    console.log(`Total columns in INSERT: ${insertColumns.length}`);
    
    if (paramCount !== insertColumns.length) {
      console.log('⚠️  WARNING: Parameter count mismatch!');
    }
    
    // Check for missing required columns
    console.log('\n=== REQUIRED COLUMNS CHECK ===\n');
    const requiredCols = schema.rows.filter(r => r.is_nullable === 'NO' && !r.column_default);
    requiredCols.forEach(col => {
      const inInsert = insertColumns.includes(col.column_name);
      console.log(`  ${col.column_name.padEnd(20)} ${inInsert ? '✅ Included' : '❌ MISSING IN INSERT'}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verify();
