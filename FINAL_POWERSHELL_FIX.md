# FINAL FIX - PowerShell Errors Explained

You are seeing TWO errors:

### Error 1:
```
.\run_vscode.bat : The term '.\run_vscode.bat' is not recognized...
```

### Error 2:
```
.\run_vscode.ps1 : The term '.\run_vscode.ps1' is not recognized...
Missing expression after unary operator '+'.
```

## Why This Happens in PowerShell

1. **You are not in the correct folder** - PowerShell can't find the file
2. **PowerShell Execution Policy blocks scripts** - By default, PowerShell blocks .ps1 files
3. **You pasted the error message into PowerShell** - The second error with `+ FullyQualifiedErrorId` happens when you copy-paste the error text itself into PowerShell, which tries to interpret `+` as an operator

## 100% Working Solution (No .bat or .ps1 needed)

**Just run this ONE command in ANY terminal (PowerShell, CMD, Bash):**

```bash
node setup.js
```

We created `setup.js` which works everywhere — PowerShell, Command Prompt, Git Bash, any terminal. It does everything the .bat/.ps1 files do.

### Steps in VS Code:

1. **Open Terminal in VS Code**: `Ctrl + ` ` (backtick) or View → Terminal

2. **Check where you are**:
```powershell
pwd
dir
```
You should see files like `server`, `client`, `package.json`, `setup.js`
If you DON'T see them, you're in wrong folder. Navigate:
```powershell
cd C:\path\to\your\mediintel
# Example:
# cd C:\Users\YourName\Downloads\mediintel
# or
# cd D:\projects\mediintel
```

3. **Run universal setup** (works in PowerShell):
```powershell
node setup.js
```
Wait 2-3 minutes for installation.

4. **Run the app**:
```powershell
npm run dev
```

5. **Open browser**:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health

---

## Alternative Manual Commands (If node setup.js also fails)

Copy-paste these ONE BY ONE in PowerShell:

```powershell
# 1. Check Node
node -v
npm -v

# 2. Root dependencies
npm install

# 3. Backend
cd server
npm install
npx prisma generate
npx prisma db push
cd ..

# 4. Frontend
cd client
npm install
cd ..

# 5. Create folders (PowerShell way)
New-Item -ItemType Directory -Force -Path uploads
New-Item -ItemType Directory -Force -Path server/uploads

# 6. Create .env file manually:
# In VS Code, right-click server folder → New File → .env
# Paste:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="medichron-ai-super-secret-2026-production-key-change-me"
# PORT=5000
# NODE_ENV=development

# 7. Run
npm run dev
```

---

## How to Switch to Command Prompt in VS Code (Easier for .bat)

1. In VS Code terminal panel, click the **dropdown arrow** next to `+`
2. Select **Command Prompt**
3. New terminal will show `C:\...>` instead of `PS C:\...>`
4. Now `run_vscode.bat` will work

## How to Allow PowerShell Scripts (If you really want .ps1)

```powershell
# Check current directory
pwd
dir

# Allow scripts for this session only (safe)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# Now run with & (call operator)
& .\run_vscode.ps1

# Or with full path
& "C:\full\path\to\run_vscode.ps1"
```

---

## The Error With `+ FullyQualifiedErrorId`

You got:
```
Missing expression after unary operator '+'.
+     + FullyQualifiedErrorId
```

This means you **copied the error message itself** and pasted it into PowerShell. PowerShell tried to run the error text as a command.

**Don't paste error messages as commands.** Just paste the fix commands above.

---

## TL;DR - What to Do Right Now

In your VS Code PowerShell terminal, run:

```powershell
pwd
dir
node setup.js
```

If `dir` doesn't show `server` and `client` folders, you need to `cd` to correct folder first.

Then:
```powershell
npm run dev
```

Open http://localhost:5173 — Done! 🏥
