#!/usr/bin/env node
// Universal setup script - works in PowerShell, CMD, Bash, any terminal
// Run with: node setup.js

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = (msg, color = 'white') => {
  const colors = { green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m', white: '\x1b[0m' };
  console.log(`${colors[color] || ''}${msg}\x1b[0m`);
};

const run = (cmd, cwd = __dirname) => {
  try {
    log(`> ${cmd}`, 'cyan');
    execSync(cmd, { stdio: 'inherit', cwd, shell: true });
    return true;
  } catch (e) {
    log(`❌ Failed: ${cmd}`, 'red');
    return false;
  }
};

console.log('');
log('🏥 MediChron AI - Universal Setup', 'cyan');
log('This works in PowerShell, CMD, Bash - any terminal', 'yellow');
console.log('');

log('Step 1: Checking Node.js...', 'yellow');
run('node -v');
run('npm -v');

console.log('');
log('Step 2: Installing root dependencies...', 'yellow');
run('npm install', __dirname);

console.log('');
log('Step 3: Setting up backend...', 'yellow');
const serverDir = path.join(__dirname, 'server');
run('npm install', serverDir);

// Create .env if not exists
const envPath = path.join(serverDir, '.env');
if (!fs.existsSync(envPath)) {
  const envContent = `DATABASE_URL="file:./dev.db"
JWT_SECRET="medichron-ai-super-secret-2026-production-key-change-me"
PORT=5000
NODE_ENV=development
`;
  fs.writeFileSync(envPath, envContent);
  log('✅ Created server/.env', 'green');
} else {
  log('✅ server/.env already exists', 'green');
}

log('Generating Prisma Client...', 'yellow');
run('npx prisma generate', serverDir);

log('Pushing database schema...', 'yellow');
run('npx prisma db push', serverDir);

console.log('');
log('Step 4: Setting up frontend...', 'yellow');
const clientDir = path.join(__dirname, 'client');
run('npm install', clientDir);

console.log('');
log('Step 5: Creating uploads folders...', 'yellow');
const uploadsDir = path.join(__dirname, 'uploads');
const serverUploadsDir = path.join(serverDir, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(serverUploadsDir)) fs.mkdirSync(serverUploadsDir, { recursive: true });
log('✅ Uploads folders created', 'green');

console.log('');
log('✅ Setup complete!', 'green');
console.log('');
log('To run the app:', 'cyan');
log('  npm run dev', 'white');
console.log('');
log('Then open:', 'cyan');
log('  Frontend: http://localhost:5173', 'white');
log('  Backend:  http://localhost:5000/api/health', 'white');
console.log('');
log('Or run separately:', 'cyan');
log('  Terminal 1: cd server && npm run dev', 'white');
log('  Terminal 2: cd client && npm run dev', 'white');
console.log('');
log('For Prisma Studio (DB viewer):', 'cyan');
log('  cd server && npx prisma studio', 'white');
console.log('');
