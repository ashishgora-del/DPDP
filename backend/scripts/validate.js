#!/usr/bin/env node

/**
 * Quick Validation Script
 * Performs basic checks before running full E2E tests
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - Missing: ${filePath}`, 'red');
    return false;
  }
}

function checkEnvVariable(envPath, variable) {
  if (!fs.existsSync(envPath)) {
    return null;
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const regex = new RegExp(`^${variable}=(.+)$`, 'm');
  const match = content.match(regex);
  
  if (match && match[1] && !match[1].includes('your-') && !match[1].includes('change-this')) {
    return match[1];
  }
  return null;
}

function validateEnvironment() {
  log('\n==============================================', 'blue');
  log('  DPDP Platform - Pre-Flight Validation', 'blue');
  log('==============================================\n', 'blue');

  let passed = 0;
  let failed = 0;

  // Check critical backend files (from backend directory context)
  log('Backend Files:', 'blue');
  const backendChecks = [
    ['src/main.ts', 'Main application file'],
    ['src/app.module.ts', 'App module'],
    ['src/risk-assessment/risk-assessment.module.ts', 'Risk Assessment module'],
    ['src/template-generation/template-generation.module.ts', 'Template Generation module'],
    ['.env.development', 'Development environment config'],
  ];

  backendChecks.forEach(([file, desc]) => {
    if (checkFile(file, desc)) passed++; else failed++;
  });

  // Check critical frontend files (from root directory)
  log('\nFrontend Files:', 'blue');
  const frontendChecks = [
    ['../src/main.tsx', 'Main React file'],
    ['../src/app/App.tsx', 'App component'],
    ['../src/modules/risk-assessment/api.ts', 'Risk Assessment API'],
    ['../src/modules/template-generation/api.ts', 'Template Generation API'],
  ];

  frontendChecks.forEach(([file, desc]) => {
    if (checkFile(file, desc)) passed++; else failed++;
  });

  // Check environment configuration
  log('\nEnvironment Configuration:', 'blue');
  const envPath = '.env.development';
  
  const dbUrl = checkEnvVariable(envPath, 'DATABASE_URL');
  if (dbUrl) {
    log('✓ DATABASE_URL configured', 'green');
    passed++;
  } else {
    log('⚠ DATABASE_URL not configured or using placeholder', 'yellow');
    failed++;
  }

  const jwtSecret = checkEnvVariable(envPath, 'JWT_SECRET');
  if (jwtSecret) {
    log('✓ JWT_SECRET configured', 'green');
    passed++;
  } else {
    log('⚠ JWT_SECRET not configured or using placeholder', 'yellow');
    failed++;
  }

  const azureKey = checkEnvVariable(envPath, 'AZURE_OPENAI_API_KEY');
  if (azureKey) {
    log('✓ AZURE_OPENAI_API_KEY configured', 'green');
    log('  (AI document generation will work)', 'blue');
    passed++;
  } else {
    log('⚠ AZURE_OPENAI_API_KEY not configured', 'yellow');
    log('  (AI document generation will fail, but templates will work)', 'yellow');
    // Don't count as failure since templates work without AI
  }

  // Check package.json dependencies
  log('\nDependencies:', 'blue');
  if (fs.existsSync('../package.json')) {
    const pkg = JSON.parse(fs.readFileSync('../package.json', 'utf-8'));
    const requiredDeps = ['react', 'react-router-dom', 'axios', 'react-markdown'];
    let depsOk = true;
    
    requiredDeps.forEach(dep => {
      if (pkg.dependencies?.[dep] || pkg.peerDependencies?.[dep]) {
        // OK
      } else {
        log(`✗ Missing dependency: ${dep}`, 'red');
        depsOk = false;
        failed++;
      }
    });
    
    if (depsOk) {
      log('✓ All required frontend dependencies present', 'green');
      passed++;
    }
  }

  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const requiredDeps = ['@nestjs/core', '@nestjs/common', 'pg', 'bcrypt', 'passport-jwt'];
    let depsOk = true;
    
    requiredDeps.forEach(dep => {
      if (pkg.dependencies?.[dep]) {
        // OK
      } else {
        log(`✗ Missing backend dependency: ${dep}`, 'red');
        depsOk = false;
        failed++;
      }
    });
    
    if (depsOk) {
      log('✓ All required backend dependencies present', 'green');
      passed++;
    }
  }

  // Summary
  log('\n==============================================', 'blue');
  log('  Validation Summary', 'blue');
  log('==============================================', 'blue');
  log(`✓ Passed: ${passed}`, 'green');
  log(`✗ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(0);
  log(`\nValidation Score: ${percentage}%`, percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red');
  log('==============================================\n', 'blue');

  if (failed > 0) {
    log('⚠ Some validations failed. Please fix the issues above before proceeding.', 'yellow');
    log('\nRecommendations:', 'blue');
    log('1. Ensure all files are present', 'yellow');
    log('2. Configure backend/.env.development with real values', 'yellow');
    log('3. Run "npm install" in both root and backend directories', 'yellow');
    log('4. For Azure OpenAI: Create resource in Azure Portal and add credentials', 'yellow');
    process.exit(1);
  } else {
    log('✓ All validations passed! Ready to start servers.', 'green');
    log('\nNext Steps:', 'blue');
    log('1. Backend: cd backend && npm run start:dev', 'yellow');
    log('2. Frontend: npm run dev', 'yellow');
    log('3. Health Check: cd backend && npm run health', 'yellow');
    log('4. E2E Tests: cd backend && node scripts/e2e-test.js', 'yellow');
    process.exit(0);
  }
}

validateEnvironment();
