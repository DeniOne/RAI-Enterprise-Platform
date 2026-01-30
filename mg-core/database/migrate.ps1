# MatrixGin v2.0 - Database Migration Script
# Description: Apply all migrations and seeds to PostgreSQL database
# Author: MatrixGin Development Team
# Date: 2025-01-21

param(
    [Parameter(Mandatory = $false)]
    [string]$DatabaseName = "matrixgin_dev",
    
    [Parameter(Mandatory = $false)]
    [string]$PostgresUser = "postgres",
    
    [Parameter(Mandatory = $false)]
    [string]$PostgresHost = "localhost",
    
    [Parameter(Mandatory = $false)]
    [int]$PostgresPort = 5432,
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipSeeds,
    
    [Parameter(Mandatory = $false)]
    [switch]$DropDatabase,
    
    [Parameter(Mandatory = $false)]
    [switch]$CreateDatabase
)

# Colors for output
function Write-Success { param($Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠ $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "✗ $Message" -ForegroundColor Red }

# Banner
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         MatrixGin v2.0 - Database Migration Tool          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Success "PostgreSQL client (psql) found"
}
catch {
    Write-Error "PostgreSQL client (psql) not found in PATH"
    Write-Info "Please install PostgreSQL and add it to your PATH"
    exit 1
}

# Connection string
$env:PGPASSWORD = $env:POSTGRES_PASSWORD
$ConnectionParams = @(
    "-U", $PostgresUser,
    "-h", $PostgresHost,
    "-p", $PostgresPort
)

Write-Info "Database: $DatabaseName"
Write-Info "Host: ${PostgresHost}:${PostgresPort}"
Write-Info "User: $PostgresUser"
Write-Host ""

# Drop database if requested
if ($DropDatabase) {
    Write-Warning "Dropping database '$DatabaseName'..."
    $DropParams = $ConnectionParams + @("-d", "postgres", "-c", "DROP DATABASE IF EXISTS $DatabaseName;")
    & psql @DropParams *>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database dropped successfully"
    }
    else {
        Write-Error "Failed to drop database"
        exit 1
    }
}

# Create database if requested or if it doesn't exist
if ($CreateDatabase -or $DropDatabase) {
    Write-Info "Creating database '$DatabaseName'..."
    $CreateParams = $ConnectionParams + @("-d", "postgres", "-c", "CREATE DATABASE $DatabaseName;")
    & psql @CreateParams *>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database created successfully"
    }
    else {
        Write-Warning "Database might already exist (this is OK)"
    }
}

Write-Host ""
Write-Info "Starting migration process..."
Write-Host ""

# Get migration files
$MigrationsPath = Join-Path $PSScriptRoot "migrations"
$MigrationFiles = Get-ChildItem -Path $MigrationsPath -Filter "*.sql" | Sort-Object Name

if ($MigrationFiles.Count -eq 0) {
    Write-Error "No migration files found in $MigrationsPath"
    exit 1
}

Write-Info "Found $($MigrationFiles.Count) migration files"
Write-Host ""

# Apply migrations
$SuccessCount = 0
$FailCount = 0

foreach ($File in $MigrationFiles) {
    Write-Host "Applying: $($File.Name)" -NoNewline
    
    $MigrationParams = $ConnectionParams + @("-d", $DatabaseName, "-f", $File.FullName)
    $Output = & psql @MigrationParams *>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " " -NoNewline
        Write-Success "OK"
        $SuccessCount++
    }
    else {
        Write-Host " " -NoNewline
        Write-Error "FAILED"
        Write-Host $Output -ForegroundColor Red
        $FailCount++
    }
}

Write-Host ""
Write-Info "Migrations completed: $SuccessCount succeeded, $FailCount failed"
Write-Host ""

# Apply seeds if not skipped
if (-not $SkipSeeds) {
    Write-Info "Starting seed process..."
    Write-Host ""
    
    $SeedsPath = Join-Path $PSScriptRoot "seeds"
    $SeedFiles = Get-ChildItem -Path $SeedsPath -Filter "*.sql" | Sort-Object Name
    
    if ($SeedFiles.Count -eq 0) {
        Write-Warning "No seed files found in $SeedsPath"
    }
    else {
        Write-Info "Found $($SeedFiles.Count) seed files"
        Write-Host ""
        
        $SeedSuccessCount = 0
        $SeedFailCount = 0
        
        foreach ($File in $SeedFiles) {
            Write-Host "Applying: $($File.Name)" -NoNewline
            
            $SeedParams = $ConnectionParams + @("-d", $DatabaseName, "-f", $File.FullName)
            $Output = & psql @SeedParams *>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host " " -NoNewline
                Write-Success "OK"
                $SeedSuccessCount++
            }
            else {
                Write-Host " " -NoNewline
                Write-Error "FAILED"
                Write-Host $Output -ForegroundColor Red
                $SeedFailCount++
            }
        }
        
        Write-Host ""
        Write-Info "Seeds completed: $SeedSuccessCount succeeded, $SeedFailCount failed"
        Write-Host ""
    }
}

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    Migration Summary                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Database: " -NoNewline
Write-Host $DatabaseName -ForegroundColor Cyan
Write-Host "Migrations: " -NoNewline
Write-Host "$SuccessCount succeeded" -ForegroundColor Green -NoNewline
Write-Host " / " -NoNewline
Write-Host "$FailCount failed" -ForegroundColor $(if ($FailCount -gt 0) { "Red" } else { "Gray" })

if (-not $SkipSeeds) {
    Write-Host "Seeds: " -NoNewline
    Write-Host "$SeedSuccessCount succeeded" -ForegroundColor Green -NoNewline
    Write-Host " / " -NoNewline
    Write-Host "$SeedFailCount failed" -ForegroundColor $(if ($SeedFailCount -gt 0) { "Red" } else { "Gray" })
}

Write-Host ""

if ($FailCount -eq 0 -and ($SkipSeeds -or $SeedFailCount -eq 0)) {
    Write-Success "All operations completed successfully!"
    Write-Host ""
    Write-Info "Test users created (password: Test123!@#):"
    Write-Host "  • admin@photomatrix.ru (Администратор)" -ForegroundColor Yellow
    Write-Host "  • hr@photomatrix.ru (HR Менеджер)" -ForegroundColor Yellow
    Write-Host "  • manager@photomatrix.ru (Руководитель департамента)" -ForegroundColor Yellow
    Write-Host "  • photographer@photomatrix.ru (Фотограф)" -ForegroundColor Yellow
    Write-Host "  • sales@photomatrix.ru (Менеджер по продажам)" -ForegroundColor Yellow
    Write-Host ""
    Write-Info "Connect to database:"
    Write-Host "  psql -U $PostgresUser -d $DatabaseName" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}
else {
    Write-Error "Some operations failed. Please check the errors above."
    Write-Host ""
    exit 1
}
