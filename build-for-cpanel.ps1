# =============================================================================
#  build-for-cpanel.ps1
#  Builds frontend + backend and produces two deployment ZIPs for cPanel.
#
#  USAGE:
#    .\build-for-cpanel.ps1                              # prompts for domain
#    .\build-for-cpanel.ps1 -Domain https://example.com # non-interactive
#
#  Output (in deploy/ folder):
#    frontend-upload.zip  → extract into  public_html/trinetrai/
#    backend-upload.zip   → extract into  nodejs_apps/backend/
#    migration.sql        → run once in phpPgAdmin
# =============================================================================

param(
    [string]$Domain = ""   # e.g. "https://yourdomain.com"
)

$ErrorActionPreference = "Stop"
$Root    = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Deploy  = Join-Path $Root "deploy"

function Banner($msg) {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
}

function Step($n, $msg)  { Write-Host ""; Write-Host "[$n] $msg" -ForegroundColor Yellow }
function Ok($msg)        { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Fail($msg)      { Write-Host "    [FAIL] $msg" -ForegroundColor Red; exit 1 }

# ── Ask for domain if not provided ─────────────────────────────────────────
if (-not $Domain) {
    Write-Host ""
    Write-Host "Enter your cPanel domain (e.g. https://yourdomain.com)" -ForegroundColor Magenta
    Write-Host "Press ENTER to keep the current .env value: " -ForegroundColor Magenta -NoNewline
    $inputDomain = Read-Host
    if ($inputDomain) { $Domain = $inputDomain.TrimEnd('/') }
}

Banner "DPDP cPanel Deployment Builder"

# ── Step 1: Clean deploy folder ─────────────────────────────────────────────
Step "1/7" "Cleaning previous deploy output..."
if (Test-Path $Deploy) { Remove-Item $Deploy -Recurse -Force }
New-Item $Deploy -ItemType Directory | Out-Null
Ok "deploy/ folder ready"

# ── Step 2: Backup and configure environment files ──────────────────────────
Step "2/6" "Configuring environment for production..."

# Backup current .env files
$FrontendEnv = Join-Path $Root ".env"
$BackendEnv  = Join-Path $Backend ".env"
$FrontendBackup = Join-Path $Root ".env.backup"
$BackendBackup  = Join-Path $Backend ".env.backup"

if (Test-Path $FrontendEnv) {
    Copy-Item $FrontendEnv $FrontendBackup -Force
    Ok "Frontend .env backed up to .env.backup"
}
if (Test-Path $BackendEnv) {
    Copy-Item $BackendEnv $BackendBackup -Force
    Ok "Backend .env backed up to backend/.env.backup"
}

# Use production environment files
$FrontendProdEnv = Join-Path $Root ".env.production"
$BackendProdEnv  = Join-Path $Backend ".env.production"

if (Test-Path $FrontendProdEnv) {
    Copy-Item $FrontendProdEnv $FrontendEnv -Force
    Ok "Using .env.production for frontend build"
} else {
    Write-Host "    [WARN] Warning: .env.production not found, using current .env" -ForegroundColor Yellow
}

if (Test-Path $BackendProdEnv) {
    Copy-Item $BackendProdEnv $BackendEnv -Force
    Ok "Using backend/.env.production for backend build"
} else {
    Write-Host "    [WARN] Warning: backend/.env.production not found, using current .env" -ForegroundColor Yellow
}

# Override API URL if domain provided
if ($Domain) {
    $apiUrl = "$Domain/api"
    $envContent = Get-Content $FrontendEnv -Raw -ErrorAction SilentlyContinue
    if ($envContent -match 'VITE_API_URL=') {
        $envContent = $envContent -replace 'VITE_API_URL=.*', "VITE_API_URL=$apiUrl"
    } else {
        $envContent += "`nVITE_API_URL=$apiUrl"
    }
    Set-Content $FrontendEnv $envContent -NoNewline
    Ok "VITE_API_URL overridden to $apiUrl"
}

# ── Step 3: Build frontend ────────────────────────────────────────────────────
Step "3/7" "Building frontend (Vite + React)..."
Set-Location $Root
npm run build
if ($LASTEXITCODE -ne 0) { Fail "Frontend build failed" }
$FrontendDist = Join-Path $Root "dist"
if (-not (Test-Path $FrontendDist)) { Fail "dist/ not found after frontend build" }
Ok "Frontend built → dist/"

# ── Step 4: Build backend ─────────────────────────────────────────────────────
Step "4/7" "Building backend (NestJS)..."
Set-Location $Backend
npm run build:prod
if ($LASTEXITCODE -ne 0) { Fail "Backend build failed" }
$BackendDist = Join-Path $Backend "dist"
if (-not (Test-Path (Join-Path $BackendDist "main.js"))) { Fail "backend/dist/main.js not found" }
Ok "Backend built → backend/dist/"

# ── Step 5: Zip frontend ──────────────────────────────────────────────────────
Step "5/7" "Zipping frontend..."
$FrontendZip = Join-Path $Deploy "frontend-upload.zip"
Compress-Archive -Path "$FrontendDist\*" -DestinationPath $FrontendZip -Force
$fzSize = [math]::Round((Get-Item $FrontendZip).Length / 1MB, 2)
Ok "frontend-upload.zip ($fzSize MB)"

# ── Step 6: Zip backend ───────────────────────────────────────────────────────
Step "6/6" "Zipping backend..."
$BackendZip = Join-Path $Deploy "backend-upload.zip"
Compress-Archive -Path "$BackendDist\*" -DestinationPath $BackendZip -Force
$bzSize = [math]::Round((Get-Item $BackendZip).Length / 1MB, 2)
Ok "backend-upload.zip ($bzSize MB)"

# ── Step 7: Restore original .env files ──────────────────────────────────────
Step "7/7" "Restoring development environment..."
if (Test-Path $FrontendBackup) {
    Copy-Item $FrontendBackup $FrontendEnv -Force
    Remove-Item $FrontendBackup
    Ok "Frontend .env restored"
}
if (Test-Path $BackendBackup) {
    Copy-Item $BackendBackup $BackendEnv -Force
    Remove-Item $BackendBackup
    Ok "Backend .env restored"
}

# Copy migration SQL alongside the zips
$SqlSrc = Join-Path $Backend "migration.sql"
if (Test-Path $SqlSrc) {
    Copy-Item $SqlSrc (Join-Path $Deploy "migration.sql") -Force
    Ok "migration.sql copied to deploy/"
}

Set-Location $Root

# ── Summary ───────────────────────────────────────────────────────────────────
Banner "BUILD COMPLETE - deploy/ is ready"

Write-Host ''
Write-Host '  [FILES] Created in deploy/' -ForegroundColor White
Write-Host "    * frontend-upload.zip ($fzSize MB)" -ForegroundColor White
Write-Host "    * backend-upload.zip ($bzSize MB)" -ForegroundColor White
Write-Host '    * migration.sql' -ForegroundColor White

Write-Host ''
Write-Host '  ---------------------------------------------------' -ForegroundColor DarkGray
Write-Host '  STEP A - Database (do this first)' -ForegroundColor Cyan
Write-Host '  ---------------------------------------------------' -ForegroundColor DarkGray
Write-Host '  1. cPanel - PostgreSQL Databases - create DB + user' -ForegroundColor White
Write-Host '  2. phpPgAdmin - select the new DB - SQL tab' -ForegroundColor White
Write-Host '  3. Paste and run  deploy/migration.sql' -ForegroundColor White

Write-Host ''
Write-Host '  ---------------------------------------------------' -ForegroundColor DarkGray
Write-Host '  STEP B - Frontend (static files)' -ForegroundColor Cyan
Write-Host '  ---------------------------------------------------' -ForegroundColor DarkGray
Write-Host '  1. File Manager - create public_html/trinetrai/' -ForegroundColor White
Write-Host '  2. Upload frontend-upload.zip into that folder' -ForegroundColor White
Write-Host '  3. Extract it there, then delete the zip' -ForegroundColor White

Write-Host ''
Write-Host '  ---------------------------------------------------' -ForegroundColor DarkGray
Write-Host '  STEP C - Backend (Node.js App)' -ForegroundColor Cyan
Write-Host '  ---------------------------------------------------' -ForegroundColor DarkGray
Write-Host '  1. File Manager - create nodejs_apps/backend/' -ForegroundColor White
Write-Host '  2. Upload backend-upload.zip there and extract it' -ForegroundColor White
Write-Host '  3. cPanel - Setup Node.js App - Create Application:' -ForegroundColor White
Write-Host ''
Write-Host '       Node.js version     : 20.x' -ForegroundColor Green
Write-Host '       Application mode    : Production' -ForegroundColor Green
Write-Host '       Application root    : nodejs_apps/backend' -ForegroundColor Green
Write-Host '       Application URL     : api' -ForegroundColor Green
Write-Host '       Startup file        : main.js' -ForegroundColor Green
Write-Host ''
Write-Host '  4. Click  Run NPM Install  in the app panel' -ForegroundColor White
Write-Host '  5. Add Environment Variables:' -ForegroundColor White
Write-Host ''
Write-Host '       NODE_ENV                 = production' -ForegroundColor DarkYellow
Write-Host '       DATABASE_URL             = postgresql://user:pass@localhost:5432/dbname' -ForegroundColor DarkYellow
Write-Host '       JWT_SECRET               = (generate with node crypto)' -ForegroundColor DarkYellow
Write-Host '       JWT_EXPIRATION           = 1h' -ForegroundColor DarkYellow
Write-Host '       REFRESH_TOKEN_SECRET     = (another random hex)' -ForegroundColor DarkYellow
Write-Host '       REFRESH_TOKEN_EXPIRATION = 7d' -ForegroundColor DarkYellow
Write-Host '       API_PREFIX               = api' -ForegroundColor DarkYellow
if ($Domain) {
    Write-Host "       CORS_ORIGINS             = $Domain" -ForegroundColor DarkYellow
} else {
    Write-Host '       CORS_ORIGINS             = https://yourdomain.com' -ForegroundColor DarkYellow
}
Write-Host ''
Write-Host '  6. Click  Start Application' -ForegroundColor White

Write-Host ''
Write-Host '  ---------------------------------------------------' -ForegroundColor DarkGray
Write-Host '  STEP D - Verify' -ForegroundColor Cyan
Write-Host '  ---------------------------------------------------' -ForegroundColor DarkGray
$verifyDomain = if ($Domain) { $Domain } else { 'https://yourdomain.com' }
Write-Host "  $verifyDomain/trinetrai/ - frontend loads" -ForegroundColor White
Write-Host "  $verifyDomain/api/health - returns ok status" -ForegroundColor White
Write-Host "  $verifyDomain/api/catalog/domains - returns 4 domains" -ForegroundColor White
Write-Host ''
