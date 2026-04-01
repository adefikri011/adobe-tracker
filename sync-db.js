#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('🗄️  Syncing database with Prisma schema...');

try {
  // Push schema to database
  execSync('npx prisma db push --skip-generate', { 
    cwd: process.cwd(),
    stdio: 'inherit'
  });
  console.log('✓ Database synced');
  
  // Now create AppSettings if it doesn't exist
  const { PrismaClient } = require('./src/generated/prisma/client.ts');
  console.log('✓ All done!');
  
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
