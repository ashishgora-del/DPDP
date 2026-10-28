#!/usr/bin/env node
/**
 * seed-templates.js - Seeds document templates into the database
 * 
 * Usage:
 *   DATABASE_URL=postgres://user:pass@host/db node scripts/seed-templates.js
 *   OR: npm run db:seed-templates
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌  DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

/**
 * Load template from JSON file
 */
function loadTemplate(templateId) {
  const templateFile = path.join(__dirname, '..', 'src', 'template-generation', 'templates', `${templateId}.json`);
  
  if (!fs.existsSync(templateFile)) {
    throw new Error(`Template file not found: ${templateFile}`);
  }
  
  const templateData = JSON.parse(fs.readFileSync(templateFile, 'utf8'));
  return templateData;
}

/**
 * Insert or update template in database
 */
async function seedTemplate(client, template) {
  const { id, name, description, version, category, is_active, structure } = template;
  
  // Check if template already exists
  const checkQuery = 'SELECT id FROM document_templates WHERE id = $1';
  const existing = await client.query(checkQuery, [id]);
  
  if (existing.rows.length > 0) {
    // Update existing template
    const updateQuery = `
      UPDATE document_templates
      SET 
        name = $2,
        description = $3,
        version = $4,
        category = $5,
        structure = $6,
        is_active = $7,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, version
    `;
    
    const result = await client.query(updateQuery, [
      id,
      name,
      description || null,
      version,
      category,
      JSON.stringify(structure),
      is_active
    ]);
    
    console.log(`   ✅  Updated template: ${result.rows[0].name} (v${result.rows[0].version})`);
  } else {
    // Insert new template
    const insertQuery = `
      INSERT INTO document_templates (id, name, description, version, category, structure, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, version
    `;
    
    const result = await client.query(insertQuery, [
      id,
      name,
      description || null,
      version,
      category,
      JSON.stringify(structure),
      is_active
    ]);
    
    console.log(`   ✅  Inserted template: ${result.rows[0].name} (v${result.rows[0].version})`);
  }
}

/**
 * Main seed function
 */
async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱  Seeding document templates...\n');
    
    // List of templates to seed
    const templates = [
      'vendor-risk-assessment',
      // Add more template IDs here as they're created
    ];
    
    for (const templateId of templates) {
      try {
        console.log(`📄  Loading template: ${templateId}`);
        const template = loadTemplate(templateId);
        await seedTemplate(client, template);
      } catch (err) {
        console.error(`   ❌  Failed to seed template ${templateId}:`, err.message);
      }
    }
    
    console.log('\n✅  Template seeding completed!\n');
    
    // Display summary
    const countQuery = 'SELECT COUNT(*) as count FROM document_templates WHERE is_active = true';
    const result = await client.query(countQuery);
    console.log(`📊  Total active templates: ${result.rows[0].count}`);
    
  } catch (err) {
    console.error('❌  Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed
seed();
