@echo off
REM AI Document Analyzer Intelligence - VS Code Setup (Windows CMD)
REM Use this in Command Prompt, NOT PowerShell
echo 🏥 AI Document Analyzer Intelligence - VS Code Setup (Windows CMD)
echo.

echo Step 1: Checking Node.js...
node -v
npm -v
if %errorlevel% neq 0 (
  echo ❌ Node.js not found! Install from https://nodejs.org
  pause
  exit /b
)

echo.
echo Step 2: Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
  echo ❌ Failed to install root dependencies
  pause
  exit /b
)

echo.
echo Step 3: Setting up backend...
cd server
call npm install
if %errorlevel% neq 0 (
  echo ❌ Failed to install server dependencies
  cd ..
  pause
  exit /b
)
if not exist .env (
  echo DATABASE_URL="file:./dev.db" > .env
  echo JWT_SECRET="healthcare-ai-document-analyzer-super-secret-2026-production-key-change-me" >> .env
  echo PORT=5000 >> .env
  echo NODE_ENV=development >> .env
  echo ✅ Created server/.env
) else (
  echo ✅ server/.env already exists
)
echo Generating Prisma Client...
call npx prisma generate
echo Pushing database schema...
call npx prisma db push
cd ..

echo.
echo Step 4: Setting up frontend...
cd client
call npm install
cd ..

echo.
echo Step 5: Creating uploads folder...
if not exist uploads mkdir uploads
if not exist server\uploads mkdir server\uploads

echo.
echo ✅ Setup complete!
echo.
echo To run the app:
echo   npm run dev
echo.
echo Then open:
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000/api/health
echo.
echo Or run separately:
echo   Terminal 1: cd server ^&^& npm run dev
echo   Terminal 2: cd client ^&^& npm run dev
echo.
pause
