# Docker deployment script for Windows PowerShell

# Function to handle errors
function Handle-Error {
    param (
        [string]$ErrorMessage
    )
    Write-Host "Error: $ErrorMessage" -ForegroundColor Red
    exit 1
}

# Display header
Write-Host "Starting deployment of Mentor application" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Handle-Error "Docker is not running. Please start Docker Desktop and try again."
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Handle-Error "docker-compose is not available. Please install Docker Desktop with docker-compose."
}

# Backup the database if it exists
if (docker-compose ps | Select-String -Pattern "postgres") {
    Write-Host "Backing up database before deployment..." -ForegroundColor Yellow
    $BackupDir = ".\db_backups"
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    $BackupFile = "$BackupDir\postgres_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    try {
        docker-compose exec -T postgres pg_dump -U postgres -d mentor > $BackupFile
        Write-Host "Database backed up to $BackupFile" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Database backup failed, continuing anyway" -ForegroundColor Yellow
    }
}

# Stop containers if they are running
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
try {
    docker-compose down --remove-orphans
} catch {
    Handle-Error "Failed to stop containers: $_"
}

# Build images
Write-Host "Building Docker images..." -ForegroundColor Yellow
try {
    docker-compose build
} catch {
    Handle-Error "Failed to build Docker images: $_"
}

# Start containers
Write-Host "Starting containers..." -ForegroundColor Yellow
try {
    docker-compose up -d
} catch {
    Handle-Error "Failed to start containers: $_"
}

# Wait for services to be healthy
Write-Host "Waiting for services to become healthy..." -ForegroundColor Yellow
$Timeout = 60
$Elapsed = 0
$Healthy = $false

while ($Elapsed -lt $Timeout) {
    if (docker-compose ps | Select-String -Pattern "Up \(healthy\)") {
        $Healthy = $true
        break
    }
    Write-Host "Waiting for services to become healthy... ($Elapsed/$Timeout seconds)" -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    $Elapsed += 5
}

if (-not $Healthy) {
    Write-Host "Warning: Some services might not be fully healthy yet. Check logs for details." -ForegroundColor Yellow
} else {
    Write-Host "All services are now healthy!" -ForegroundColor Green
}

# Display success message
Write-Host "Application deployed successfully!" -ForegroundColor Green
Write-Host "Frontend: http://localhost" -ForegroundColor Green
Write-Host "Backend API: http://localhost:5000" -ForegroundColor Green

# Display helpful commands
Write-Host "`nUseful commands:" -ForegroundColor Yellow
Write-Host "View logs: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "Stop application: docker-compose down" -ForegroundColor Cyan
Write-Host "Restart services: docker-compose restart" -ForegroundColor Cyan 