#!/usr/bin/env node

// Denylist check to prevent legacy file reintroduction
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const DENIED_PATTERNS = [
  'client/src/pages/checkout.tsx', // Old checkout (not the renamed checkout-simple)
  'client/src/pages/checkout-new.tsx',
  'client/src/pages/checkout.jsx',
  'client/src/components/checkout/**', // Any files not in our approved list
  'client/src/pages/onboarding/legacy/**',
  'client/src/hooks/useDefaultAddress.ts*',
  'client/src/hooks/useCheckout.ts*'
];

const ALLOWED_FILES = [
  'client/src/pages/checkout.tsx', // This is our renamed checkout-simple
  'client/src/components/checkout/AddressBlock.tsx',
  'client/src/hooks/use-addresses.ts',
  'client/src/components/addresses/AddressForm.tsx',
  'client/src/components/AddToCartButton.tsx'
];

console.log('🔍 Checking for denied legacy files...');

let foundDeniedFiles = false;

for (const pattern of DENIED_PATTERNS) {
  const matches = glob.sync(pattern, { ignore: ALLOWED_FILES });
  if (matches.length > 0) {
    console.error(`❌ Found denied files matching pattern: ${pattern}`);
    matches.forEach(file => console.error(`   - ${file}`));
    foundDeniedFiles = true;
  }
}

if (foundDeniedFiles) {
  console.error('\n💥 Build failed: Legacy files detected. Remove them before deploying.');
  process.exit(1);
} else {
  console.log('✅ No denied files found. Build can proceed.');
  process.exit(0);
}