# CityEar - Stop Infrastructure

Write-Host "🌆 CityEar - Stopping Infrastructure..." -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Stopping Docker Compose services..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All services stopped successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To remove all data (volumes), run:" -ForegroundColor Yellow
    Write-Host "  docker-compose down -v" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to stop services" -ForegroundColor Red
    exit 1
}
