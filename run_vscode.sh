#!/bin/bash
echo "🏥 AI Document Analyzer Intelligence - VS Code Setup (Mac/Linux)"
echo ""

echo "Step 1: Checking Node.js..."
node -v
npm -v
if [ $? -ne 0 ]; then
  echo "❌ Node.js not found! Install from https://nodejs.org"
  exit 1
fi

echo ""
echo "Step 2: Installing root dependencies..."
npm install

echo ""
echo "Step 3: Setting up backend..."
cd server
npm install
if [ ! -f .env ]; then
  cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
JWT_SECRET="healthcare-ai-document-analyzer-super-secret-2026-production-key-change-me"
PORT=5000
NODE_ENV=development
EOF
  echo "✅ Created server/.env"
else
  echo "✅ server/.env already exists"
fi
echo "Generating Prisma Client..."
npx prisma generate
echo "Pushing database schema..."
npx prisma db push
cd ..

echo ""
echo "Step 4: Setting up frontend..."
cd client
npm install
cd ..

echo ""
echo "Step 5: Creating uploads folder..."
mkdir -p uploads
mkdir -p server/uploads

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the app:"
echo "  npm run dev"
echo ""
echo "Then open:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:5000/api/health"
echo ""
echo "Or run separately:"
echo "  Terminal 1: cd server && npm run dev"
echo "  Terminal 2: cd client && npm run dev"
echo ""
echo "For Prisma Studio (DB viewer):"
echo "  cd server && npx prisma studio"
