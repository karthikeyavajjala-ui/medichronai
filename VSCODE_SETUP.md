# How to Run AI Document Analyzer in VS Code (Local)

This is a complete, production-ready full-stack healthcare app with real document processing. Follow these steps exactly.

## Prerequisites

- **Node.js 18+** (20 recommended) — https://nodejs.org
- **npm 9+** (comes with Node)
- **VS Code** — https://code.visualstudio.com
- **Git** (optional)

Check versions:
```bash
node -v
npm -v
```

## Step 1: Get the Code in VS Code

### Option A: Download from Arena Workspace
1. In Arena chat, all files are under `/home/user`
2. Download the entire project folder as zip (if available) OR
3. Copy the `server` and `client` folders manually to your local machine

### Option B: Create New Project and Copy Files
1. Open VS Code
2. `File → Open Folder → Create new folder` e.g., `mediintel`
3. Inside `mediintel`, create two folders: `server` and `client`
4. Copy all files from this workspace (`/home/user/server/*` and `/home/user/client/*`) into your local folders
5. Also copy `/home/user/package.json`, `/home/user/README.md`

Your local structure should be:
```
mediintel/
├── package.json (root)
├── README.md
├── server/
│   ├── package.json
│   ├── .env (you will create)
│   ├── prisma/schema.prisma
│   └── src/
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
└── uploads/ (create this)
```

## Step 2: Setup Backend (Server)

1. Open VS Code Terminal: `` Ctrl + ` `` (or View → Terminal)

2. Go to server folder and install:
```bash
cd server
npm install
```

3. Create `.env` file inside `server/` folder:
```bash
# Windows: echo DATABASE_URL="file:./dev.db" > .env
# Mac/Linux:
cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
JWT_SECRET="medichron-ai-super-secret-2026-production-key-change-me"
PORT=5000
NODE_ENV=development
EOF
```

Or manually create `server/.env` file in VS Code with content:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="medichron-ai-super-secret-2026-production-key-change-me"
PORT=5000
NODE_ENV=development
```

4. Setup database (SQLite via Prisma):
```bash
npx prisma generate
npx prisma db push
```
You should see: `Your database is now in sync with your Prisma schema` and `dev.db` file created.

5. Create uploads folder (from project root):
```bash
# From mediintel root:
mkdir -p uploads
# Or from server folder:
mkdir -p ../uploads
# Also ensure server can write to /home/user/uploads alternative:
mkdir -p uploads
```

## Step 3: Setup Frontend (Client)

1. In a new terminal (or same terminal):
```bash
cd ../client
# or if you're in server folder: cd ../client
npm install
```

2. Check `vite.config.js` has proxy to backend:
```js
server: {
  host: '0.0.0.0',
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true
    }
  }
}
```
If you downloaded our version, it's already configured with `allowedHosts: true` for cloud previews — you can keep it or simplify for local.

## Step 4: Run the Application

### Option 1: Run Both Together (Recommended)

From **project root** (`mediintel/`):

First install root dependencies:
```bash
cd ..
# you should be in mediintel/
npm install
```

Then run both:
```bash
npm run dev
```
This uses `concurrently` to run:
- Backend on http://localhost:5000
- Frontend on http://localhost:5173

### Option 2: Run Separately (Two Terminals in VS Code)

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```
You should see:
```
🏥 AI Document Analyzer Intelligence Server running on port 5000
📊 Health check: http://localhost:5000/api/health
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
You should see:
```
VITE v5.4.21 ready in ... 
Local: http://localhost:5173/
```

## Step 5: Open in Browser

- **Frontend App**: http://localhost:5173
- **Backend Health Check**: http://localhost:5000/api/health → should return `{"status":"ok",...}`

## Step 6: Test Complete Workflow (Final Acceptance Test)

### Doctor Flow
1. Go to http://localhost:5173/signup
2. Create Doctor Account:
   - Name: Dr. John
   - Email: doctor@test.com
   - Password: Test@12345 (min 8 chars)
   - Designation: General Physician (or any of 28)
   - Phone: 9876543210
3. Note your **Doctor ID** auto-generated: e.g., `26GP001` (YY + Specialty + Seq)
4. You will be redirected to Doctor Dashboard
5. Click **Add Patient**:
   - Name: John Doe
   - DOB: 1990-05-15
   - Gender: Male
   - Phone: 9876543210
   - Email: john@test.com
   - Blood Group: O+
6. Note **Patient ID** auto-generated: e.g., `26GP001P001` (DOCTOR_ID + P + Seq)
7. Open Patient Profile → Upload Documents:
   - Upload a real medical PDF (Blood Test, Lab Report, etc.)
   - Supported: PDF, JPG, PNG, WEBP (max 20MB)
   - Watch processing: Uploading → Extracting → Analyzing → Structuring → Building Timeline → Completed
8. View:
   - Lab Results table with source traceability (Page number, confidence)
   - Timeline (chronological, auto-updates)
   - Document Viewer with View Source
9. Add Visit and Prescription → Timeline auto-updates
10. Compare Reports: Select two documents → See Increased/Decreased/Newly reported
11. AI Assistant: Ask "Summarize my medical history" → Answer with source references
12. Export Excel/PDF: Real data export with 7 sheets

### Second Doctor Flow (Access Control)
1. Sign up second doctor: e.g., Cardiologist → ID `26CARD001`
2. Go to Patient Search → Enter `26GP001P001` (first doctor's patient)
3. Should see **Access Required** (no history revealed) — server-side enforced
4. Click Request Access → Send request
5. Login as Patient (see below) → Approve access
6. Second doctor can now view timeline, docs, etc.

### Patient Flow
1. Go to http://localhost:5173/activate
2. Activate:
   - Patient ID: `26GP001P001`
   - Email: `john@test.com` (same as created)
   - Password: `Patient@12345`
3. Login at http://localhost:5173/login → Select Patient tab → Enter Patient ID or Email + Password
4. Patient Dashboard: View My Documents, Timeline, Lab Results, Prescriptions
5. AI Assistant: Ask "Explain my report in simple language"
6. Go to Doctor Access → See pending requests → Approve as Full/Limited/Temporary → Can revoke anytime
7. Verify revoked access no longer exposes records

### Create Demo Data (Quick Testing)
1. As Doctor, on Dashboard click **Create Demo Data**
2. Creates 3 synthetic patients with:
   - Blood reports Jan Hb 11.2 Low → March Hb 12.4 Normal
   - Visits, timeline, relationships
   - Clearly labeled as demo, separate from real records

## VS Code Tips

### Recommended Extensions
- **Prisma** (Prisma.prisma) — syntax highlighting for schema.prisma
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **ES7+ React/Redux/React-Native snippets**
- **Prettier** (esbenp.prettier-vscode)

### Debugging
- Backend logs appear in Terminal 1
- Frontend HMR (Hot Module Reload) auto-refreshes on file save
- If port 5000 or 5173 already in use:
```bash
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```
- Change ports in `server/.env` (PORT) and `client/vite.config.js` (port)

### Database Management
- View data:
```bash
cd server
npx prisma studio
```
Opens Prisma Studio at http://localhost:5555

- Reset database (deletes all data):
```bash
cd server
rm dev.db
npx prisma db push
```

- Generate Prisma Client after schema changes:
```bash
npx prisma generate
```

## Production Build

### Frontend Production Build
```bash
cd client
npm run build
# Creates dist/ folder
# Preview production build:
npm run preview
```

### Backend Production Start
```bash
cd server
npm start
# Uses node src/index.js (not nodemon)
```

### Deploy Backend to Serve Frontend (Optional)
1. Build frontend:
```bash
cd client
npm run build
```
2. Copy `client/dist` to `server/public` or configure Express to serve static:
```js
// In server/src/index.js add:
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (req,res) => res.sendFile(path.join(__dirname, '../../client/dist/index.html')));
```

## Environment Variables for Production

In `server/.env`:
```
DATABASE_URL="file:./dev.db" # or PostgreSQL/MySQL URL for production
JWT_SECRET="use-a-very-long-random-secret-at-least-32-chars"
PORT=5000
NODE_ENV=production
```

For real AI LLM (optional OpenAI):
```
OPENAI_API_KEY="sk-..." # Optional, app works without it using local RAG
```

## Troubleshooting

**Issue: `Cannot find module 'pdf-parse'` or `pdfjs-dist`**
```bash
cd server
npm install pdf-parse pdfjs-dist --save
```

**Issue: `Prisma Client not generated`**
```bash
cd server
npx prisma generate
```

**Issue: `Uploads folder not found` or `File not found on server`**
```bash
mkdir -p uploads
mkdir -p server/uploads
# Ensure server/src/routes/documents.js points to correct path
# Our code checks both /home/user/uploads and ../uploads
```

**Issue: `Invalid file type` on upload**
- Only PDF, JPG, JPEG, PNG, WEBP allowed (20MB max)
- Check file extension and MIME type

**Issue: `Access Required` even for primary doctor**
- Ensure Patient's `primaryDoctorId` matches your doctor's `id`
- Check token is valid (not expired) — re-login
- Check server logs for access verification errors

**Issue: Frontend shows blank or 404**
- Ensure backend is running on 5000
- Check vite.config.js proxy target is http://localhost:5000
- Clear browser cache, hard refresh Ctrl+Shift+R

**Issue: PDF extraction fails or shows "Needs Review"**
- Some scanned PDFs require OCR — ensure file is not too low quality
- Our pipeline marks as Needs Review with reason, preserves original
- Try uncompressed PDF (PDFKit with compress:false) or real hospital PDFs usually work with pdfjs-dist
- For images, tesseract.js OCR is attempted

## Project Structure Recap

```
mediintel/
├── package.json (root with concurrently)
├── server/
│   ├── package.json
│   ├── .env
│   ├── dev.db (SQLite, auto-created)
│   ├── prisma/
│   │   └── schema.prisma (17 models: Doctor, Patient, MedicalDocument, etc.)
│   └── src/
│       ├── index.js (Express server)
│       ├── config/ (database, constants with 28 designations)
│       ├── middleware/auth.js (JWT + role + patient access verification)
│       ├── controllers/ (auth, patient, document, timeline, visit, access, ai)
│       ├── services/
│       │   ├── documentProcessor.js (real pipeline: pdfjs-dist → classification → extraction → events → relationships → timeline)
│       │   ├── extractionService.js (regex for labs, vitals, diagnoses, meds)
│       │   ├── classificationService.js (Blood Test 96% etc.)
│       │   ├── aiAssistantService.js (RAG with 3 modes + source refs)
│       │   └── exportService.js (xlsx + pdfkit real exports)
│       └── routes/
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx (protected routes for doctor/patient)
│       ├── context/AuthContext.jsx
│       ├── services/api.js (axios with interceptors)
│       ├── components/Layout.jsx (DoctorSidebar, PatientSidebar, Navbar)
│       ├── components/UI.jsx (Card, Button, Badge, etc.)
│       └── pages/ (Landing, Auth, DoctorDashboard, PatientProfile, DocumentViewer, Timeline, AI Assistant, Compare, etc.)
└── uploads/ (private document storage)
```

## Need Help?

- Check `README.md` for feature list and acceptance test
- Check server logs in terminal for errors
- Check browser console (F12) for frontend errors
- Ensure Node 18+ and npm 9+

**All major buttons are real functionality — real API calls, real DB, real file handling, real processing pipeline.**

Happy coding! 🏥
