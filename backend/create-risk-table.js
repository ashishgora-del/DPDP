const { Pool } = require('pg');

async function createRiskAssessmentsTable() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:yagya@localhost:5432/dymgcxar_AI_police_v2'
  });

  try {
    console.log('Creating risk_assessments table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_assessments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        org_name TEXT NOT NULL,
        
        -- Questionnaire answers
        q1_org_profile TEXT NOT NULL,
        q2_geography TEXT NOT NULL,
        q3_data_principals TEXT NOT NULL,
        q4_large_scale TEXT NOT NULL,
        q5_data_types TEXT NOT NULL,
        q6_purposes TEXT NOT NULL,
        q7_ai_use TEXT NOT NULL,
        q8_vendors TEXT NOT NULL,
        q9_cross_border TEXT NOT NULL,
        q10_volume TEXT NOT NULL,
        
        -- Risk assessment results
        risk_tier TEXT NOT NULL,
        focus_areas TEXT[] DEFAULT '{}',
        sdf_flag BOOLEAN DEFAULT FALSE,
        risk_drivers TEXT[] DEFAULT '{}',
        template_pack_id TEXT,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Foreign key to users table
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_id ON risk_assessments(user_id);
      CREATE INDEX IF NOT EXISTS idx_risk_assessments_created_at ON risk_assessments(created_at);
    `);
    
    console.log('✅ risk_assessments table created successfully!');
  } catch (error) {
    console.error('❌ Failed to create table:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createRiskAssessmentsTable();
