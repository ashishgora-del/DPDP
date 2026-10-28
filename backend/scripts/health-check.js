#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * Tests all health endpoints to verify deployment
 * Usage: node scripts/health-check.js [base-url]
 * Example: node scripts/health-check.js https://api.yourdomain.com
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const startTime = Date.now();
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        try {
          const json = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            data: json,
            responseTime,
          });
        } catch (error) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: 'Invalid JSON response',
            responseTime,
          });
        }
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        success: false,
        error: error.message,
        responseTime,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        success: false,
        error: 'Request timeout',
        responseTime,
      });
    });
  });
}

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  log('\n🏥 Health Check Report', COLORS.bright + COLORS.cyan);
  log('='.repeat(60), COLORS.cyan);
  log(`Base URL: ${baseUrl}\n`, COLORS.yellow);

  const endpoints = [
    { name: 'Main Health', path: '/api/health' },
    { name: 'Database Health', path: '/api/health/db' },
    { name: 'Readiness Probe', path: '/api/health/ready' },
    { name: 'Liveness Probe', path: '/api/health/live' },
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    const url = `${baseUrl}${endpoint.path}`;
    log(`Checking: ${endpoint.name}`, COLORS.cyan);
    log(`  URL: ${url}`, COLORS.reset);

    const result = await checkEndpoint(url);

    if (result.success) {
      log(`  ✓ Status: ${result.statusCode} OK`, COLORS.green);
      log(`  Response Time: ${result.responseTime}ms`, COLORS.green);
      
      if (result.data) {
        if (result.data.status) {
          log(`  Status: ${result.data.status}`, COLORS.green);
        }
        if (result.data.database) {
          log(`  Database: ${result.data.database}`, COLORS.green);
        }
        if (result.data.uptime !== undefined) {
          log(`  Uptime: ${Math.floor(result.data.uptime)}s`, COLORS.green);
        }
      }
    } else {
      allPassed = false;
      log(`  ✗ Failed`, COLORS.red);
      if (result.statusCode) {
        log(`  Status Code: ${result.statusCode}`, COLORS.red);
      }
      if (result.error) {
        log(`  Error: ${result.error}`, COLORS.red);
      }
      log(`  Response Time: ${result.responseTime}ms`, COLORS.yellow);
    }
    
    log('', COLORS.reset);
  }

  log('='.repeat(60), COLORS.cyan);
  
  if (allPassed) {
    log('✅ All health checks passed!', COLORS.bright + COLORS.green);
    process.exit(0);
  } else {
    log('❌ Some health checks failed!', COLORS.bright + COLORS.red);
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Health check script error: ${error.message}`, COLORS.red);
  process.exit(1);
});
