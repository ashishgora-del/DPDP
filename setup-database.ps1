# =============================================================================
# Database Setup Script for Risk Assessment & Template Generation
# Run this script to set up the database tables and seed data
# =============================================================================

param(
    [string]$DatabaseName = "dymgcxar_AI_police_v2"
)

$ErrorActionPreference = "Stop"
$BackendRoot = Join-Path $PSScriptRoot "backend"

function Banner($msg, $color = "Cyan") {
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor $color
    Write-Host "  $msg" -ForegroundColor $color
    Write-Host ("=" * 70) -ForegroundColor $color
    Write-Host ""
}

function Step($n, $msg) { Write-Host ""; Write-Host "[$n] $msg" -ForegroundColor Yellow }
function Ok($msg) { Write-Host "    ✓ $msg" -ForegroundColor Green }
function Info($msg) { Write-Host "    ℹ $msg" -ForegroundColor Cyan }
function Warn($msg) { Write-Host "    ⚠ $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "    ✗ $msg" -ForegroundColor Red; exit 1 }

Banner "Risk Assessment & Template Generation - Database Setup"

# Check if psql is available
Step "1/3" "Checking PostgreSQL installation..."
try {
    $psqlVersion = psql --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Fail "PostgreSQL (psql) not found. Please install PostgreSQL first."
    }
    Ok "PostgreSQL found: $psqlVersion"
} catch {
    Fail "PostgreSQL (psql) not found. Please install PostgreSQL first."
}

# Check if database exists
Step "2/3" "Checking database connection..."
$checkDb = "SELECT 1" | psql -d $DatabaseName -t 2>&1
if ($LASTEXITCODE -ne 0) {
    Warn "Cannot connect to database '$DatabaseName'"
    Write-Host ""
    Write-Host "Please ensure:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL is running" -ForegroundColor White
    Write-Host "  2. Database '$DatabaseName' exists" -ForegroundColor White
    Write-Host "  3. You have access permissions" -ForegroundColor White
    Write-Host ""
    Write-Host "To create the database, run:" -ForegroundColor Cyan
    Write-Host "  psql -U postgres -c `"CREATE DATABASE $DatabaseName;`"" -ForegroundColor White
    Write-Host ""
    exit 1
}
Ok "Connected to database: $DatabaseName"

# Run migration
Step "3/3" "Running database migration..."
$migrationFile = Join-Path $BackendRoot "migration-risk-template.sql"
if (-not (Test-Path $migrationFile)) {
    Fail "Migration file not found: $migrationFile"
}

Info "Applying migration-risk-template.sql..."
$migrationOutput = psql -d $DatabaseName -f $migrationFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Fail "Migration failed. Check the error above."
}
Ok "Migration completed successfully"

# Seed artifacts
Info "Seeding artifacts data..."
$seedFile = Join-Path $BackendRoot "scripts\seed-artifacts.sql"
if (-not (Test-Path $seedFile)) {
    Fail "Seed file not found: $seedFile"
}

$seedOutput = psql -d $DatabaseName -f $seedFile 2>&1
if ($LASTEXITCODE -ne 0) {
    Fail "Seeding failed. Check the error above."
}

# Extract artifact count from output
$artifactCount = $seedOutput | Select-String "total_artifacts" -Context 1,0
if ($artifactCount) {
    Ok "Artifacts seeded successfully"
    Write-Host ""
    Write-Host "    Summary:" -ForegroundColor Cyan
    Write-Host "    $($seedOutput | Select-String -Pattern '\d+' | Select-Object -Last 3)" -ForegroundColor White
} else {
    Ok "Artifacts seeded (verification query may have failed, but data was inserted)"
}

# Verify tables
Write-Host ""
Info "Verifying tables..."
$tables = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('risk_assessments', 'artifacts', 'generated_documents');" | psql -d $DatabaseName -t
$tableList = $tables -split "`n" | Where-Object { $_.Trim() -ne "" }

if ($tableList.Count -eq 3) {
    Ok "All 3 tables created successfully:"
    foreach ($table in $tableList) {
        Write-Host "       - $($table.Trim())" -ForegroundColor Green
    }
} else {
    Warn "Expected 3 tables, found $($tableList.Count)"
}

Banner "Database Setup Complete!" "Green"

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Switch to development environment:" -ForegroundColor White
Write-Host "     .\switch-env.ps1 dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start the backend server:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Gray
Write-Host "     npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Test the API endpoints:" -ForegroundColor White
Write-Host "     http://localhost:3001/api/docs" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Check implementation guide:" -ForegroundColor White
Write-Host "     RISK_ASSESSMENT_TEMPLATE_GENERATION_IMPLEMENTATION.md" -ForegroundColor Gray
Write-Host ""
