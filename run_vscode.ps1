# AI Document Analyzer Intelligence - VS Code Setup (PowerShell)
Write-Host "🏥 AI Document Analyzer Intelligence - VS Code Setup (PowerShell)" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Step 1: Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node -v
    $npmVersion = npm -v
    Write-Host "✅ Node: $nodeVersion | npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Install from https://nodejs.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Step 2: Installing root dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Step 3: Setting up backend..." -ForegroundColor Yellow
Set-Location server
npm install

if (-not (Test-Path ".env")) {
    @"
DATABASE_URL="file:./dev.db"
JWT_SECRET="healthcare-ai-document-analyzer-super-secret-2026-production-key-change-me"
PORT=5000
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✅ Created server/.env" -ForegroundColor Green
} else {
    Write-Host "✅ server/.env already exists" -ForegroundColor Green
}

Write-Host "Generating Prisma Client..."
npx prisma generate
Write-Host "Pushing database schema..."
npx prisma db push
Set-Location ..

Write-Host ""
Write-Host "Step 4: Setting up frontend..." -ForegroundColor Yellow
Set-Location client
npm install
Set-Location ..

Write-Host ""
Write-Host "Step 5: Creating uploads folder..." -ForegroundColor Yellow
if (-not (Test-Path "uploads")) { New-Item -ItemType Directory -Path "uploads" | Out-Null }
if (-not (Test-Path "server/uploads")) { New-Item -ItemType Directory -Path "server/uploads" | Out-Null }

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To run the app:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then open:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Or run separately:" -ForegroundColor Cyan
Write-Host "  Terminal 1: cd server; npm run dev" -ForegroundColor White
Write-Host "  Terminal 2: cd client; npm run dev" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
