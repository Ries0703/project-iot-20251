# CityEar - Infrastructure Startup Guide

Write-Host "🌆 CityEar - Starting Infrastructure..." -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Navigate to project directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Docker Compose services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "🌐 Access Points:" -ForegroundColor Cyan
    Write-Host "  PostgreSQL:     localhost:5432" -ForegroundColor White
    Write-Host "    User: admin / Password: admin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  EMQX Dashboard: http://localhost:18083" -ForegroundColor White
    Write-Host "    User: admin / Password: public" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  PgAdmin:        http://localhost:5050" -ForegroundColor White
    Write-Host "    Email: admin@cityear.com / Password: admin" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⏳ Waiting for services to be healthy (30s)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "🔍 Running health checks..." -ForegroundColor Yellow
    
    # Check PostgreSQL
    Write-Host "  Checking PostgreSQL..." -ForegroundColor Gray
    $pgCheck = docker exec cityear-postgres pg_isready -U admin -d cityear 2>&1
    if ($pgCheck -like "*accepting connections*") {
        Write-Host "  ✅ PostgreSQL is ready" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  PostgreSQL might not be ready yet" -ForegroundColor Yellow
    }
    
    # Check EMQX
    Write-Host "  Checking EMQX..." -ForegroundColor Gray
    try {
        $emqxCheck = Invoke-WebRequest -Uri "http://localhost:18083" -UseBasicParsing -TimeoutSec 5 2>&1
        Write-Host "  ✅ EMQX Dashboard is accessible" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  EMQX Dashboard might not be ready yet" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "🚀 Infrastructure is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. cd backend && npm install" -ForegroundColor White
    Write-Host "  2. npm run start:dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to start services. Check the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "View logs with:" -ForegroundColor Yellow
    Write-Host "  docker-compose logs" -ForegroundColor White
    exit 1
}
