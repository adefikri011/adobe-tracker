#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('🔄 Regenerating Prisma Client...');

try {
  // Clean previous artifacts
  execSync('rm -rf node_modules/.prisma src/generated', { cwd: process.cwd() });
  console.log('✓ Cleaned old artifacts');
  
  // Generate new client
  execSync('npx prisma generate', { 
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  console.log('✓ Prisma Client regenerated');
  
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
