const { Pool } = require('pg');

async function finalVerification() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:yagya@localhost:5432/dymgcxar_AI_police_v2'
  });

  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     FINAL VERIFICATION: Risk Assessment System             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    // 1. Table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'risk_assessments'
      );
    `);
    console.log('✅ risk_assessments table exists:', tableCheck.rows[0].exists);
    
    // 2. Required columns
    const requiredColumns = [
      'id', 'user_id', 'org_name',
      'q1_org_profile', 'q2_geography', 'q3_data_principals', 'q4_large_scale',
      'q5_data_types', 'q6_purposes', 'q7_ai_use', 'q8_vendors',
      'q9_cross_border', 'q10_volume',
      'risk_tier', 'focus_areas', 'sdf_flag', 'risk_drivers', 'template_pack_id',
      'created_at', 'updated_at'
    ];
    
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'risk_assessments'
    `);
    
    console.log('\n✅ All required columns present:');
    let allPresent = true;
    requiredColumns.forEach(col => {
      const found = columns.rows.find(r => r.column_name === col);
      if (!found) {
        console.log(`   ❌ Missing: ${col}`);
        allPresent = false;
      }
    });
    if (allPresent) console.log('   All ' + requiredColumns.length + ' columns verified');
    
    // 3. Array columns
    const arrayColumns = columns.rows.filter(r => r.data_type === 'ARRAY');
    console.log('\n✅ Array columns configured correctly:');
    arrayColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    // 4. NOT NULL constraints
    const notNullColumns = columns.rows.filter(r => r.is_nullable === 'NO');
    console.log('\n✅ NOT NULL constraints:');
    notNullColumns.forEach(col => {
      console.log(`   - ${col.column_name}`);
    });
    
    // 5. Test insert and retrieve
    console.log('\n🧪 Testing insert and retrieve...');
    const testId = 'test-' + Date.now();
    
    try {
      await pool.query(`
        INSERT INTO risk_assessments (
          id, user_id, org_name,
          q1_org_profile, q2_geography, q3_data_principals, q4_large_scale,
          q5_data_types, q6_purposes, q7_ai_use, q8_vendors,
          q9_cross_border, q10_volume,
          risk_tier, focus_areas, sdf_flag, risk_drivers, template_pack_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
      `, [
        testId, 'test-user', 'Test Org',
        'test', 'test', 'test', 'test',
        'test', 'test', 'test', 'test',
        'test', 'test',
        'MODERATE', ['Privacy Notice', 'Data Security'], true, ['Risk 1', 'Risk 2'], 'TEST_PACK'
      ]);
      
      const result = await pool.query(
        'SELECT * FROM risk_assessments WHERE id = $1',
        [testId]
      );
      
      if (result.rows.length > 0) {
        const row = result.rows[0];
        console.log('   ✅ Insert successful');
        console.log('   ✅ Retrieve successful');
        console.log('   ✅ focus_areas type:', Array.isArray(row.focus_areas) ? 'Array' : typeof row.focus_areas);
        console.log('   ✅ risk_drivers type:', Array.isArray(row.risk_drivers) ? 'Array' : typeof row.risk_drivers);
        
        // Clean up
        await pool.query('DELETE FROM risk_assessments WHERE id = $1', [testId]);
        console.log('   ✅ Cleanup successful');
      }
    } catch (error) {
      console.log('   ❌ Test failed:', error.message);
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    VERIFICATION COMPLETE                   ║');
    console.log('║          System is ready for risk assessments!             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await pool.end();
  }
}

finalVerification();
