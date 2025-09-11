#!/usr/bin/env node

/**
 * Build Verification Script
 * Ensures all critical configurations are correct before deployment
 */

const fs = require('fs');
const path = require('path');

const EXPECTED_STRIPE_API_VERSION = '2025-08-27.basil';
const INCORRECT_STRIPE_API_VERSION = '2024-11-20.acacia';

console.log('🔍 Starting build verification...\n');

// Find all Stripe route files
const stripeRoutes = [
  'src/app/api/create-checkout-session/route.ts',
  'src/app/api/stripe/get-session/route.ts', 
  'src/app/api/webhooks/stripe/route.ts'
];

let hasErrors = false;

// Check Stripe API versions
console.log('📊 Checking Stripe API versions...');
for (const routePath of stripeRoutes) {
  const fullPath = path.join(process.cwd(), routePath);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes(INCORRECT_STRIPE_API_VERSION)) {
      console.error(`❌ FOUND INCORRECT API VERSION in ${routePath}:`);
      console.error(`   Expected: ${EXPECTED_STRIPE_API_VERSION}`);
      console.error(`   Found: ${INCORRECT_STRIPE_API_VERSION}`);
      hasErrors = true;
    } else if (content.includes(EXPECTED_STRIPE_API_VERSION)) {
      console.log(`✅ ${routePath} - API version correct`);
    } else {
      console.warn(`⚠️  ${routePath} - No Stripe API version found`);
    }
  } else {
    console.warn(`⚠️  ${routePath} - File not found`);
  }
}

// Check package.json for Node version
console.log('\n📦 Checking Node.js version specification...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.engines && packageJson.engines.node) {
    console.log(`✅ Node.js version specified: ${packageJson.engines.node}`);
  } else {
    console.error('❌ No Node.js version specified in package.json');
    hasErrors = true;
  }
} else {
  console.error('❌ package.json not found');
  hasErrors = true;
}

// Check for .nvmrc
console.log('\n📝 Checking .nvmrc file...');
const nvmrcPath = path.join(process.cwd(), '.nvmrc');
if (fs.existsSync(nvmrcPath)) {
  const nodeVersion = fs.readFileSync(nvmrcPath, 'utf8').trim();
  console.log(`✅ .nvmrc found with Node version: ${nodeVersion}`);
} else {
  console.warn('⚠️  .nvmrc file not found');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ BUILD VERIFICATION FAILED');
  console.error('Please fix the errors above before deploying.');
  process.exit(1);
} else {
  console.log('✅ BUILD VERIFICATION PASSED');
  console.log('All critical configurations are correct.');
  console.log('Safe to proceed with deployment.');
}