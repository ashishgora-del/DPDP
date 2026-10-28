# =============================================================================
# Environment Switcher Script
# Quickly switch between development and production configurations
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('dev', 'development', 'prod', 'production', 'status')]
    [string]$Environment
)

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

function Banner($msg, $color = "Cyan") {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor $color
    Write-Host "  $msg" -ForegroundColor $color
    Write-Host ("=" * 60) -ForegroundColor $color
    Write-Host ""
}

function Ok($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Info($msg) { Write-Host "  ℹ $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red; exit 1 }

# Show current environment status
if ($Environment -eq 'status') {
    Banner "Current Environment Status" "Magenta"
    
    Write-Host "Frontend Configuration:" -ForegroundColor Yellow
    if (Test-Path "$Root\.env") {
        $frontendEnv = Get-Content "$Root\.env" -Raw
        if ($frontendEnv -match 'VITE_API_URL=([^\s]+)') {
            $apiUrl = $matches[1]
            Info "API URL: $apiUrl"
            if ($apiUrl -match 'localhost') {
                Write-Host "  📍 Mode: DEVELOPMENT" -ForegroundColor Green
            } else {
                Write-Host "  📍 Mode: PRODUCTION" -ForegroundColor Yellow
            }
        }
    } else {
        Warn ".env file not found"
    }
    
    Write-Host "`nBackend Configuration:" -ForegroundColor Yellow
    if (Test-Path "$Root\backend\.env") {
        $backendEnv = Get-Content "$Root\backend\.env" -Raw
        if ($backendEnv -match 'NODE_ENV=([^\s]+)') {
            $nodeEnv = $matches[1]
            Info "NODE_ENV: $nodeEnv"
        }
        if ($backendEnv -match 'DATABASE_URL=([^\s]+)') {
            $dbUrl = $matches[1]
            # Mask password in output
            $dbUrlSafe = $dbUrl -replace ':[^@]+@', ':****@'
            Info "Database: $dbUrlSafe"
        }
    } else {
        Warn "backend/.env file not found"
    }
    
    Write-Host ""
    exit 0
}

# Switch to development
if ($Environment -in @('dev', 'development')) {
    Banner "Switching to DEVELOPMENT Mode" "Green"
    
    $frontendSrc = "$Root\.env.development"
    $frontendDst = "$Root\.env"
    $backendSrc = "$Root\backend\.env.development"
    $backendDst = "$Root\backend\.env"
    
    if (-not (Test-Path $frontendSrc)) {
        Fail ".env.development not found. Run setup first."
    }
    if (-not (Test-Path $backendSrc)) {
        Fail "backend/.env.development not found. Run setup first."
    }
    
    Copy-Item $frontendSrc $frontendDst -Force
    Ok "Frontend: .env.development → .env"
    
    Copy-Item $backendSrc $backendDst -Force
    Ok "Backend: backend/.env.development → backend/.env"
    
    Write-Host ""
    Info "Frontend API: http://localhost:3001/api"
    Info "Backend Port: 3001"
    Info "Database: Local PostgreSQL"
    Write-Host ""
    Info "Start development:"
    Write-Host "    npm run dev                      # Frontend" -ForegroundColor White
    Write-Host "    cd backend && npm run start:dev  # Backend" -ForegroundColor White
    Write-Host ""
}

# Switch to production
if ($Environment -in @('prod', 'production')) {
    Banner "Switching to PRODUCTION Mode" "Yellow"
    
    $frontendSrc = "$Root\.env.production"
    $frontendDst = "$Root\.env"
    $backendSrc = "$Root\backend\.env.production"
    $backendDst = "$Root\backend\.env"
    
    if (-not (Test-Path $frontendSrc)) {
        Fail ".env.production not found. Run setup first."
    }
    if (-not (Test-Path $backendSrc)) {
        Fail "backend/.env.production not found. Run setup first."
    }
    
    # Warn user about production mode
    Write-Host "⚠️  WARNING: Switching to PRODUCTION configuration" -ForegroundColor Yellow
    Write-Host "   This will use production database and secrets." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Press ENTER to continue or Ctrl+C to cancel..." -ForegroundColor Yellow
    Read-Host
    
    Copy-Item $frontendSrc $frontendDst -Force
    Ok "Frontend: .env.production → .env"
    
    Copy-Item $backendSrc $backendDst -Force
    Ok "Backend: backend/.env.production → backend/.env"
    
    Write-Host ""
    Info "Frontend API: https://urjourney.in/api"
    Info "Backend Port: 3001"
    Info "Database: cPanel PostgreSQL"
    Write-Host ""
    Warn "Remember to switch back to development after testing:"
    Write-Host "    .\switch-env.ps1 dev" -ForegroundColor White
    Write-Host ""
}

Banner "✓ Environment Switch Complete" "Green"
