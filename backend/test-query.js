const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:yagya@localhost:5432/dymgcxar_AI_police_v2' });

async function test() {
  try {
    // Test 1: JSONB @> containment (array contains value)
    const q1 = await pool.query(
      "SELECT COUNT(*) FROM artifacts WHERE applicable_risk_tiers @> $1",
      [JSON.stringify(['MODERATE'])]
    );
    console.log('✅ @> with JSON.stringify array works. Count:', q1.rows[0].count);
  } catch(e) {
    console.error('❌ @> failed:', e.message);
  }

  try {
    // Test 2: ? operator (check if key exists in jsonb)
    const q2 = await pool.query(
      "SELECT COUNT(*) FROM artifacts WHERE applicable_risk_tiers::jsonb ? $1",
      ['MODERATE']
    );
    console.log('✅ ? operator works. Count:', q2.rows[0].count);
  } catch(e) {
    console.error('❌ ? failed:', e.message);
  }

  try {
    // Test 3: simple LIKE on text cast
    const q3 = await pool.query(
      "SELECT COUNT(*) FROM artifacts WHERE applicable_risk_tiers::text LIKE $1",
      ['%MODERATE%']
    );
    console.log('✅ LIKE works. Count:', q3.rows[0].count);
  } catch(e) {
    console.error('❌ LIKE failed:', e.message);
  }

  await pool.end();
}

test();
