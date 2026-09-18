# Fix: .\run_vscode.bat not recognized in PowerShell

This error happens because you're using **PowerShell** terminal in VS Code, which handles `.bat` files differently than Command Prompt.

## Error You Saw
```
.\run_vscode.bat : The term '.\run_vscode.bat' is not recognized...
```

## Solution 1: Easiest - Use Command Prompt in VS Code (Recommended)

1. In VS Code, look at the top-right of your terminal panel
2. Click the **dropdown arrow** next to the `+` icon
3. Select **Command Prompt** (not PowerShell)
4. Now run:
```
run_vscode.bat
```
Or:
```
.\run_vscode.bat
```

## Solution 2: Run in PowerShell Using CMD

In your **PowerShell** terminal, run:
```powershell
cmd /c run_vscode.bat
```
This tells PowerShell to execute via Command Prompt.

## Solution 3: Use PowerShell Script (Best for PowerShell)

We created a PowerShell version for you: `run_vscode.ps1`

In PowerShell terminal, run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\run_vscode.ps1
```

If it says execution policy error, first run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
```
Then:
```powershell
.\run_vscode.ps1
```

## Solution 4: Skip Scripts - Run Manual Commands (Most Reliable)

This is what the .bat/.ps1 scripts do anyway — just run these directly in **any terminal** (PowerShell or CMD):

```powershell
# Check Node.js
node -v
npm -v

# Root dependencies
npm install

# Backend setup
cd server
npm install

# Create .env file - in VS Code, create new file server/.env with:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="medichron-ai-super-secret-2026-production-key-change-me"
# PORT=5000
# NODE_ENV=development

# Or via PowerShell command:
@"
DATABASE_URL="file:./dev.db"
JWT_SECRET="medichron-ai-super-secret-2026-production-key-change-me"
PORT=5000
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding utf8

npx prisma generate
npx prisma db push
cd ..

# Frontend setup
cd client
npm install
cd ..

# Create uploads folder
mkdir uploads
mkdir server/uploads -Force

# Run the app
npm run dev
```

Then open:
- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health

## Solution 5: Change Default Terminal in VS Code

1. Press `Ctrl + Shift + P`
2. Type: `Terminal: Select Default Profile`
3. Choose **Command Prompt**
4. Close terminal and open new terminal (now it will be CMD)
5. Run `run_vscode.bat`

## Which Terminal Are You Using?

- **PowerShell**: Prompt looks like `PS C:\path>`
- **Command Prompt**: Prompt looks like `C:\path>`

The `.bat` file is for Command Prompt. The `.ps1` file is for PowerShell.

---

**Quick Fix Right Now — Copy Paste This in PowerShell:**

```powershell
cmd /c run_vscode.bat
```

If that still fails, just run the manual commands from Solution 4 — they work 100% in PowerShell.
