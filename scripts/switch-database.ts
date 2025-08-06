import fs from 'fs';

const mode = process.argv[2];

if (!mode || !['development', 'production'].includes(mode)) {
  console.log('Usage: npm run db:switch [development|production]');
  process.exit(1);
}

console.log(`Switching to ${mode} mode...`);

// Update NODE_ENV
process.env.NODE_ENV = mode;

console.log(`✅ Switched to ${mode} mode`);
console.log('Restart your server for changes to take effect');