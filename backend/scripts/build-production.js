#!/usr/bin/env node

/**
 * Production Build Script for cPanel Deployment
 * 
 * This script:
 * 1. Cleans previous build
 * 2. Compiles TypeScript to JavaScript
 * 3. Copies necessary files for production
 * 4. Creates deployment package
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function execCommand(command, description) {
  log(`\n${description}...`, COLORS.cyan);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} complete`, COLORS.green);
  } catch (error) {
    log(`✗ ${description} failed`, '\x1b[31m');
    process.exit(1);
  }
}

function copyFile(src, dest) {
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    log(`  ✓ Copied ${path.basename(src)}`, COLORS.green);
  } catch (error) {
    log(`  ✗ Failed to copy ${src}: ${error.message}`, '\x1b[31m');
  }
}

function copyDirectory(src, dest) {
  try {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
    log(`  ✓ Copied directory ${path.basename(src)}`, COLORS.green);
  } catch (error) {
    log(`  ✗ Failed to copy directory ${src}: ${error.message}`, '\x1b[31m');
  }
}

function main() {
  log('\n🚀 Building Backend for Production Deployment', COLORS.bright + COLORS.blue);
  log('=' .repeat(60), COLORS.blue);

  // Step 1: Clean previous build
  execCommand('npm run clean || echo "Clean script not found, skipping..."', 'Step 1: Cleaning previous build');

  // Step 2: Compile TypeScript
  execCommand('npm run build', 'Step 2: Compiling TypeScript');

  // Step 3: Copy configuration files
  log('\nStep 3: Copying configuration files...', COLORS.cyan);
  
  const distDir = path.join(__dirname, '..', 'dist');
  
  // Copy package files — patch scripts for production layout (main.js is at root, not dist/)
  const pkgSrc = path.join(__dirname, '..', 'package.json');
  const pkgDest = path.join(distDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgSrc, 'utf8'));
  pkg.scripts['start']      = 'node main.js';
  pkg.scripts['start:prod'] = 'node main.js';
  fs.writeFileSync(pkgDest, JSON.stringify(pkg, null, 2));
  log('  ✓ Copied package.json (start script patched → node main.js)', COLORS.green);

  copyFile(
    path.join(__dirname, '..', 'package-lock.json'),
    path.join(distDir, 'package-lock.json')
  );

  // Copy prisma directory if it exists
  const prismaDir = path.join(__dirname, '..', 'prisma');
  if (fs.existsSync(prismaDir)) {
    copyDirectory(prismaDir, path.join(distDir, 'prisma'));
  }

  // Create .env.example in dist
  const envExample = `# Production Environment Variables
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# API Configuration
API_PREFIX=api

# CORS (comma-separated origins)
CORS_ORIGINS=https://yourdomain.com

# Optional: Redis for caching
# REDIS_HOST=localhost
# REDIS_PORT=6379
`;

  fs.writeFileSync(path.join(distDir, '.env.example'), envExample);
  log('  ✓ Created .env.example', COLORS.green);

  // Create README for deployment
  const deploymentReadme = `# Production Deployment Package

## Quick Start

1. Upload this entire \`dist\` folder to your server
2. Copy \`.env.example\` to \`.env\` and configure
3. Run: \`npm install --production\`
4. Start application (cPanel will handle this automatically)

## Environment Setup

Edit \`.env\` with your production values:
- DATABASE_URL: Your PostgreSQL connection string
- JWT_SECRET: Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
- JWT_REFRESH_SECRET: Generate another unique secret
- CORS_ORIGIN: Your frontend domain

## Health Check

Once deployed, verify at:
- \`/api/health\` - Overall health status
- \`/api/health/db\` - Database connection
- \`/api/health/ready\` - Readiness probe
- \`/api/health/live\` - Liveness probe

## API Documentation

Swagger docs available at: \`/api/docs\`

## Support

See CPANEL_DEPLOYMENT_INFO.md for detailed deployment instructions.
`;

  fs.writeFileSync(path.join(distDir, 'README.md'), deploymentReadme);
  log('  ✓ Created deployment README.md', COLORS.green);

  // Step 4: Summary
  log('\n' + '='.repeat(60), COLORS.blue);
  log('✅ Build Complete!', COLORS.bright + COLORS.green);
  log('\n📦 Deployment Package Location:', COLORS.yellow);
  log(`   ${distDir}`, COLORS.bright);
  
  log('\n📋 Next Steps:', COLORS.yellow);
  log('   1. Copy the entire dist/ folder to your server', COLORS.reset);
  log('   2. Create .env file from .env.example', COLORS.reset);
  log('   3. Run: npm install --production', COLORS.reset);
  log('   4. Configure cPanel Node.js app', COLORS.reset);
  log('   5. Start the application', COLORS.reset);
  
  log('\n🔗 Useful Commands:', COLORS.yellow);
  log('   Health check: curl http://localhost:3000/api/health', COLORS.reset);
  log('   API docs: http://localhost:3000/api/docs', COLORS.reset);
  
  log('\n' + '='.repeat(60), COLORS.blue);
}

// Run the build
main();
